# Canvas JSON API

The existing Django project remains in `axiomapi/`. Run from `backend-new/api`:

```bash
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python axiomapi/manage.py runserver 127.0.0.1:8000
```

No database migrations are needed for the Canvas endpoints. Each GET request
requires `Authorization: Bearer <Canvas access token>`. There is deliberately no
fallback to a shared server token: each caller accesses their own Canvas data.
For a multiuser application, obtain these tokens through Canvas OAuth; the OAuth
login flow is not implemented here. Personal tokens can be used for local testing.

| GET endpoint | JSON result |
| --- | --- |
| `/api/courses/` | `courses`: active student courses, title/code, weighting and grade alert state |
| `/api/todo/` | `items`: original Canvas to-do records |
| `/api/courses/<id>/assignment-groups/` | `groups`: original Canvas assignment groups and grading rules |
| `/api/assignments/` | `assignments`: selected assignments as a flat list |
| `/api/assignments/weekly/` | `weeks`: Monday–Sunday buckets, each containing course groups and assignments |

Assignment objects include `course_id`, `course_title`, `assignment_id`, `title`,
`due_at`, `lock_at`, `effective_due_at`, `date_source`, `url`, `group`,
`group_weight`, `weighted`, `below_b`, and `alert`. Dates serialize as ISO 8601
strings with timezone offsets. `alert` is either null or an object containing
`symbol: "!"` and a message. `below_b: null` means the grade is unavailable.

Selection matches the CLI: assignments in the to-do list, plus unfinished
assignments without due dates from active courses. A missing due date falls back
to the lock date for grouping; the original `due_at` remains null. Assignments
without either date appear in a week with null start/end. Completed undated
assignments are excluded. Past lock dates remain visible. Group weight refers to
the entire category and only applies when `weighted` is true. Ordering is by
week, course title, and date/title; there is no priority ranking.

```javascript
const response = await fetch('http://127.0.0.1:8000/api/assignments/weekly/', {
  headers: { Authorization: `Bearer ${canvasAccessToken}` }
});
const data = await response.json();
if (!response.ok) throw new Error(data.error);
// Render data.weeks -> week.courses -> course.assignments.
```

Environment configuration (export variables before starting; .env files are not
loaded automatically):

- `CANVAS_DOMAIN`: `uncc.instructure.com` (hostname only, configured server-side)
- `CANVAS_TIMEZONE`: `America/New_York`
- `CANVAS_B_THRESHOLD`: `83` (numeric percentage cutoff, not automatically inferred from the syllabus)
- `API_ALLOWED_ORIGINS`: comma-separated origins; defaults to localhost and 127.0.0.1 on port 3000
- `DJANGO_ALLOWED_HOSTS`: comma-separated hostnames; defaults to localhost, 127.0.0.1, and [::1]
- `DJANGO_DEBUG`: defaults to false
- `DJANGO_SECRET_KEY`: set a private value for deployment; the generated development fallback remains

Responses disable caching. Missing tokens return 401; upstream authentication,
permission, not-found and rate-limit errors preserve 401/403/404/429; other upstream
failures return 502 or 503 with a JSON `error`. Only GET and browser OPTIONS are
supported. Fetching assignments currently makes paginated Canvas calls for each
course on every request, so avoid frequent polling.

```bash
.venv/bin/python axiomapi/manage.py check
.venv/bin/python axiomapi/manage.py test api
```

Changes: no directories moved. Shared fetch code is now `axiomapi/api/canvas.py`;
`../group-fetch.py` imports it and retains its CLI output. The shared transport uses
Python's standard library with certifi's CA bundle, so `requests` is no longer needed for this script/API. Install the API requirements in whichever environment runs the CLI too.

HTTPS certificate verification uses the system trust store plus certifi. Connection failures distinguish `canvas_tls_error`, `canvas_dns_error`, and `canvas_timeout`.
