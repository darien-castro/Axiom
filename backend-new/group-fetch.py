"""
Fetch Canvas to-do assignments plus unfinished assignments without due dates.
This is a dev script to test ordering and timestamped API responses.


Run with CANVAS_ACCESS_TOKEN set. Optional: CANVAS_DOMAIN,
CANVAS_TIMEZONE (default America/New_York), CANVAS_B_THRESHOLD (default 83).
Group weights describe the whole assignment group, not an individual assignment.
"""
import os
from collections import defaultdict
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests


class CanvasClient:
    def __init__(self, domain, token):
        self.base = f"https://{domain}/api/v1"
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {token}"

    def list(self, path, params=None):
        url = self.base + path
        params = {"per_page": 100, **(params or {})}
        result = []
        while url:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            result.extend(response.json())
            url = response.links.get("next", {}).get("url")
            params = None
            # Never forward the bearer token to another origin via pagination.
            if url and not url.startswith(self.base + "/"):
                raise ValueError("Canvas returned a pagination URL outside the API origin")
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


def format_date(value):
    return value.strftime("%a %b %d, %Y %I:%M %p %Z") if value else "Not set"


def print_assignments(assignments):
    print(f"Assignments: {len(assignments)}")
    for monday, items in group_by_week(assignments).items():
        print(f"\nWeek of {monday} through {monday + timedelta(days=6)}" if monday else "\nUnscheduled (no due or lock date)")
        courses = defaultdict(list)
        for item in items:
            courses[(item["course_title"], str(item["course_id"]))].append(item)
        for (title, _), course_items in sorted(courses.items()):
            print(f"  {title}")
            for item in sorted(course_items, key=lambda a: (a["effective_due_at"] is None, a["effective_due_at"], a["title"])):
                alert = "! " if item["below_b"] else ""
                print(f"    {alert}{item['title']}")
                print(f"      Due: {format_date(item['due_at'])}")
                print(f"      Locks: {format_date(item['lock_at'])}")
                if not item["due_at"] and item["lock_at"]:
                    print("      Scheduled using lock date")
                weight = f"{item['group_weight']}% of course grade" if item['weighted'] and item['group_weight'] is not None else "weight unavailable" if item['weighted'] else "course uses points, no group weighting"
                print(f"      Group: {item['group']} ({weight})")
                print(f"      Link: {item['url'] or 'Unavailable'}")
                if item["below_b"]:
                    print("      ! Current course grade is below the configured B cutoff")


def main():
    token = os.environ.get("CANVAS_ACCESS_TOKEN", "").strip()
    if not token:
        raise SystemExit("Set CANVAS_ACCESS_TOKEN before running this script.")
    client = CanvasClient(os.environ.get("CANVAS_DOMAIN", "uncc.instructure.com"), token)
    try:
        assignments = fetch_assignments(client, ZoneInfo(os.environ.get("CANVAS_TIMEZONE", "America/New_York")), float(os.environ.get("CANVAS_B_THRESHOLD", "83")))
        print_assignments(assignments)
    except requests.HTTPError as error:
        raise SystemExit(f"Canvas request failed with HTTP {error.response.status_code}.") from None
    except requests.RequestException:
        raise SystemExit("Canvas connection failed; check your network and Canvas domain.") from None
    finally:
        client.session.close()


if __name__ == "__main__":
    main()
