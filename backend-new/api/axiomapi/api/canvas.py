"""Canvas transport and assignment selection shared by CLI and HTTP views."""
import json
import ssl
import certifi
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from collections import defaultdict
from datetime import datetime, timedelta

class CanvasClient:
    def __init__(self, domain, token):
        self.base = f"https://{domain}/api/v1"
        self.token = token
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.load_verify_locations(cafile=certifi.where())

    def list(self, path, params=None):
        url = self.base + path + "?" + urlencode({"per_page": 100, **(params or {})}, doseq=True)
        result = []
        while url:
            if not url.startswith(self.base + "/"):
                raise ValueError("Unexpected pagination origin")
            request = Request(url, headers={"Authorization": f"Bearer {self.token}"})
            with urlopen(request, timeout=30, context=self.ssl_context) as response:
                result.extend(json.load(response))
                links = response.headers.get("Link", "")
            url = None
            for link in links.split(","):
                pieces = link.strip().split(";")
                if any(part.strip() == 'rel="next"' for part in pieces[1:]):
                    url = pieces[0].strip().strip("<>")
        return result

def parse_date(value, tz):
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(tz) if value else None


def below_b(course, threshold):
    if course.get("hide_final_grades"):
        return None
    for enrollment in course.get("enrollments", []):
        if enrollment.get("type") != "student":
            continue
        score = enrollment.get("computed_current_score")
        if score is not None:
            return float(score) < threshold
    return None


def fetch_assignments(client, tz, threshold=83):
    courses = client.list("/courses", {
        "enrollment_type": "student", "enrollment_state": "active",
        "include[]": "total_scores",
    })
    todo = client.list("/users/self/todo")
    todo_ids = set()
    for item in todo:
        assignment = item.get("assignment") or {}
        course_id = assignment.get("course_id") or item.get("course_id")
        if assignment.get("id") is not None and course_id is not None:
            todo_ids.add((str(course_id), str(assignment["id"])))

    result = []
    for course in courses:
        cid = course["id"]
        groups = {str(g["id"]): g for g in client.list(f"/courses/{cid}/assignment_groups")}
        assignments = client.list(f"/courses/{cid}/assignments", {
            "include[]": "submission", "override_assignment_dates": "true",
        })
        for assignment in assignments:
            submission = assignment.get("submission") or {}
            in_todo = (str(cid), str(assignment["id"])) in todo_ids
            unfinished = not submission.get("excused") and submission.get("workflow_state") not in {
                "submitted", "graded", "pending_review",
            }
            if not in_todo and (assignment.get("due_at") or not unfinished):
                continue
            due = parse_date(assignment.get("due_at"), tz)
            lock = parse_date(assignment.get("lock_at"), tz)
            group = groups.get(str(assignment.get("assignment_group_id")), {})
            result.append({
                "course_id": cid, "course_title": course["name"],
                "assignment_id": assignment["id"], "title": assignment["name"],
                "due_at": due, "lock_at": lock, "effective_due_at": due or lock,
                "url": assignment.get("html_url"), "group": group.get("name", "Unknown group"),
                "group_weight": group.get("group_weight"),
                "weighted": course.get("apply_assignment_group_weights", False),
                "below_b": below_b(course, threshold),
            })
    return result


def group_by_week(assignments):
    weeks = defaultdict(list)
    for assignment in assignments:
        effective = assignment["effective_due_at"]
        monday = effective.date() - timedelta(days=effective.weekday()) if effective else None
        weeks[monday].append(assignment)
    return dict(sorted(weeks.items(), key=lambda pair: (pair[0] is None, pair[0])))


