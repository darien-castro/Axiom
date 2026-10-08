import os
from datetime import datetime, timezone

import requests


CANVAS_DOMAIN = "uncc.instructure.com"
ACCESS_TOKEN = os.environ.get("CANVAS_ACCESS_TOKEN", "").strip()

if not ACCESS_TOKEN:
    raise SystemExit("Set the CANVAS_ACCESS_TOKEN environment variable before running this script.")

url = f"https://{CANVAS_DOMAIN}/api/v1/users/self/todo"
headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
params = {
    "start_date": datetime.now(timezone.utc).isoformat(),
    "per_page": 50,
}

response = requests.get(url, headers=headers, params=params, timeout=30)

if response.status_code == 200:
    items = response.json()
    print(f"To-do items ({len(items)}):")

    if not items:
        print("No upcoming items.")
    else:
        for item in items:
            plannable = item.get("plannable") or {}
            item_type = item.get("plannable_type") or item.get("type") or "Item"
            title = item.get("title") or plannable.get("title") or "Untitled"
            due_date = item.get("todo_date") or plannable.get("due_at")
            context = item.get("context_name")
            item_url = item.get("html_url")

            print(f"- [{item_type}] {title}")
            if due_date:
                print(f"  Due: {due_date}")
            if context:
                print(f"  Course: {context}")
            if item_url:
                print(f"  Link: {item_url}")
else:
    print(f"Failed to fetch data. Status Code: {response.status_code}")
    if response.text:
        print(response.text)
