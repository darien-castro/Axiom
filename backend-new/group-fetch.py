"""Development CLI. Configure CANVAS_ACCESS_TOKEN before running."""

# export CANVAS_ACCESS_TOKEN='YOUR-TOKEN-HERE'
# python backend-new/request-test.py

import os
import sys
from pathlib import Path
from collections import defaultdict
from datetime import timedelta
from zoneinfo import ZoneInfo
from urllib.error import HTTPError, URLError
sys.path.insert(0, str(Path(__file__).resolve().parent / "api" / "axiomapi"))
from api.canvas import CanvasClient, fetch_assignments, group_by_week

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
    except HTTPError as error:
        raise SystemExit(f"Canvas request failed with HTTP {error.code}.") from None
    except (URLError, TimeoutError):
        raise SystemExit("Canvas connection failed; check your network and Canvas domain.") from None


if __name__ == "__main__":
    main()
