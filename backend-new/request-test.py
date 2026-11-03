import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import requests


# export CANVAS_ACCESS_TOKEN='PASTE-TOKEN-HERE'
# python backend-new/request-test.py

CANVAS_DOMAIN = "uncc.instructure.com"
ACCESS_TOKEN = os.environ.get("CANVAS_ACCESS_TOKEN", "").strip()
LOCAL_TIMEZONE = ZoneInfo("America/New_York")

if not ACCESS_TOKEN:
    raise SystemExit(
        "Set the CANVAS_ACCESS_TOKEN environment variable before running this script."
    )


def parse_canvas_datetime(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        LOCAL_TIMEZONE
    )

def fetch_user_account_info():
    url = f"https://{CANVAS_DOMAIN}/api/v1/users/self/profile"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

    response = requests.get(
        url,
        headers=headers,
        timeout=30,
        )
    response.raise_for_status()

    return response.json()




def fetch_todo_items():
    url = f"https://{CANVAS_DOMAIN}/api/v1/users/self/todo"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    params = {"per_page": 100}
    items = []

    while url:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()
        items.extend(response.json())
        url = response.links.get("next", {}).get("url")
        params = None

    return items


def normalize_item(item):
    details = (
        item.get("assignment")
        or item.get("quiz")
        or item.get("discussion_topic")
        or item.get("plannable")
        or {}
    )
    due_at = parse_canvas_datetime(
        details.get("due_at")
        or details.get("todo_date")
        or item.get("due_at")
        or item.get("todo_date")
    )

    return {
        "title": (
            details.get("name")
            or details.get("title")
            or item.get("title")
            or "Untitled"
        ),
        "course": item.get("context_name") or "Unknown course",
        "due_at": due_at,
        "url": item.get("html_url") or details.get("html_url"),
    }


def week_start(due_at):
    due_date = due_at.date()
    return due_date - timedelta(days=due_date.weekday())


def print_todo_by_week(items):
    grouped = defaultdict(list)
    undated = []

    for raw_item in items:
        item = normalize_item(raw_item)
        if item["due_at"] is None:
            undated.append(item)
        else:
            grouped[week_start(item["due_at"])].append(item)

    print(f"Your to-do list items ({len(items)}):")

    if not items:
        print("No current to-do items.")
        return

    for monday in sorted(grouped):
        sunday = monday + timedelta(days=6)
        print(f"\nWeek of {monday:%b %d}–{sunday:%b %d, %Y}")

        weekly_items = sorted(
            grouped[monday],
            key=lambda item: (
                item["course"].casefold(),
                item["due_at"],
                item["title"].casefold(),
            ),
        )

        current_course = None
        for item in weekly_items:
            if item["course"] != current_course:
                current_course = item["course"]
                print(f"  {current_course}")

            print(f"    {item['due_at']:%a %b %d, %I:%M %p} — {item['title']}")
            if item["url"]:
                print(f"      {item['url']}")

    if undated:
        print("\nNo due date")
        for item in sorted(
            undated,
            key=lambda item: (
                item["course"].casefold(),
                item["title"].casefold(),
            ),
        ):
            print(f"  {item['course']} — {item['title']}")
            if item["url"]:
                print(f"    {item['url']}")


try:
    user = fetch_user_account_info()

    display_name = (
        user.get("short_name")
        or user.get("name")
        or "Canvas user"
    )

    print(f"\nHello, {display_name}!")
    print_todo_by_week(fetch_todo_items())
except requests.HTTPError as error:
    status = error.response.status_code if error.response is not None else "unknown"
    raise SystemExit(f"Canvas request failed with status {status}.") from error
except requests.RequestException as error:
    raise SystemExit(f"Canvas request failed: {error}") from error
