from django.conf import settings
from django.http import HttpResponse

class BrowserAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        origin = request.headers.get('Origin')
        allowed = origin in settings.API_ALLOWED_ORIGINS
        response = HttpResponse(status=204) if request.method == 'OPTIONS' and allowed else self.get_response(request)
        response['Cache-Control'] = 'no-store'
        response['Vary'] = 'Origin'
        if allowed:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        return response
