"""Read-only Canvas JSON endpoints. Credentials are scoped to each request."""
import ssl
import socket
from functools import wraps
from datetime import timedelta
from urllib.error import HTTPError, URLError
from zoneinfo import ZoneInfo
from django.conf import settings
from django.http import JsonResponse
from .canvas import CanvasClient, fetch_assignments, group_by_week, below_b


def endpoint(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.method != 'GET':
            response = JsonResponse({'error': 'method_not_allowed'}, status=405)
            response['Allow'] = 'GET'
            return response
        scheme, _, token = request.headers.get('Authorization', '').partition(' ')
        if scheme.lower() != 'bearer' or not token.strip():
            response = JsonResponse({'error': 'canvas_token_required'}, status=401)
            response['WWW-Authenticate'] = 'Bearer'
            return response
        client = CanvasClient(settings.CANVAS_DOMAIN, token.strip())
        try:
            return JsonResponse(view(client, *args, **kwargs))
        except HTTPError as error:
            status = error.code if error.code in (401, 403, 404, 429) else 502
            return JsonResponse({'error': 'canvas_request_failed', 'upstream_status': error.code}, status=status)
        except (TimeoutError, URLError) as error:
            reason = getattr(error, 'reason', error)
            code = ('canvas_tls_error' if isinstance(reason, ssl.SSLError)
                    else 'canvas_dns_error' if isinstance(reason, socket.gaierror)
                    else 'canvas_timeout' if isinstance(reason, TimeoutError)
                    else 'canvas_unavailable')
            return JsonResponse({'error': code}, status=503)
        except (ValueError, KeyError, TypeError):
            return JsonResponse({'error': 'invalid_canvas_response'}, status=502)
    return wrapped


@endpoint
def courses(client):
    data = client.list('/courses', {'enrollment_type': 'student', 'enrollment_state': 'active', 'include[]': 'total_scores'})
    return {'courses': [{
        'id': c['id'], 'title': c['name'], 'code': c.get('course_code'),
        'weighted': c.get('apply_assignment_group_weights', False),
        'below_b': below_b(c, settings.CANVAS_B_THRESHOLD),
    } for c in data], 'b_threshold': settings.CANVAS_B_THRESHOLD}


@endpoint
def todo(client):
    return {'items': client.list('/users/self/todo')}


@endpoint
def assignment_groups(client, course_id):
    return {'course_id': course_id, 'groups': client.list(f'/courses/{course_id}/assignment_groups')}


def load_assignments(client):
    items = fetch_assignments(client, ZoneInfo(settings.CANVAS_TIMEZONE), settings.CANVAS_B_THRESHOLD)
    for item in items:
        item['date_source'] = 'due_at' if item['due_at'] else 'lock_at' if item['lock_at'] else None
        item['alert'] = {'symbol': '!', 'message': 'Current course grade is below B'} if item['below_b'] else None
    return items


@endpoint
def assignments(client):
    return {'assignments': load_assignments(client), 'timezone': settings.CANVAS_TIMEZONE}


@endpoint
def weekly_assignments(client):
    items = load_assignments(client)
    weeks = []
    for monday, assignments in group_by_week(items).items():
        courses = {}
        for assignment in sorted(assignments, key=lambda a: (a['effective_due_at'] is None, a['effective_due_at'], a['title'])):
            course = courses.setdefault(assignment['course_id'], {
                'course_id': assignment['course_id'], 'course_title': assignment['course_title'], 'assignments': [],
            })
            course['assignments'].append(assignment)
        weeks.append({'week_start': monday, 'week_end': monday + timedelta(days=6) if monday else None,
                      'courses': sorted(courses.values(), key=lambda c: c['course_title'].casefold())})
    return {'count': len(items), 'timezone': settings.CANVAS_TIMEZONE,
            'b_threshold': settings.CANVAS_B_THRESHOLD, 'weeks': weeks}
