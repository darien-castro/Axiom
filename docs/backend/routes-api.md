# Routes API Reference

All backend routes are mounted under the `/api` prefix on port `5000`.

---

## Route Catalog

### `GET /healthz`
- **Description**: Lightweight health probe.
- **Response**: `200 OK`
  ```json
  { "ok": true, "status": "healthy" }
  ```

---

### `POST /api/verify`
- **Description**: Validates a Canvas API key against Canvas LMS, registers the student in PostgreSQL, and caches user details.
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token" }
  ```
- **Responses**:
  - `200 OK`: Valid token (`true`).
  - `400 Bad Request`: Missing or non-string API key.
  - `401 Unauthorized`: Invalid Canvas token (`false`).

---

### `POST /api/courses`
- **Description**: Retrieves all courses enrolled by the authenticated student.
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token" }
  ```
- **Response**: `200 OK` array of `CleanCourse` objects.

---

### `POST /api/course`
- **Description**: Retrieves details for an individual course by ID.
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token", "courseID": "265289" }
  ```

---

### `POST /api/assignments`
- **Description**: Retrieves the complete list of assignments for a course.
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token", "courseID": "265289" }
  ```

---

### `GET /api/courses/:courseID/assignments/availability`
- **Description**: Retrieves the student's effective assignment availability dates for a course, including any extensions. Dates Canvas leaves unset are `null`.
- **Authentication**: Signed-in session cookie (`credentials: "include"` in the web app) or `X-API-Key` header.
- **Response**: `200 OK`
  ```json
  {
    "assignments": [
      {
        "assignmentId": "101",
        "assignmentName": "Lab report",
        "availableFrom": "2026-11-19T15:00:00Z",
        "dueAt": "2026-11-20T23:00:00Z",
        "availableUntil": "2026-11-23T23:00:00Z",
        "lockedForUser": false,
        "outstanding": true,
        "estimatedMinutes": 75,
        "reportCount": 3
      }
    ]
  }
  ```
  `lockedForUser` is `null` if Canvas omits the lock status. `outstanding` uses the current student's Canvas submission state. The time estimate is the median of saved reports and is `null` when none exist.
- **Optional query**: `?gradeImpact=true` also returns `pointsPossible`, `gradeImpactPercent`, and the student's visible `submissionGrade` (`label` and `score`, or `null`). The impact percentage estimates the assignment's share of the final course grade and is `null` when Canvas data or grading rules prevent a reliable estimate.
- **Responses**:
  - `401 Unauthorized`: Missing or invalid authentication.
  - `403 Forbidden`: Canvas denies access to the course.
  - `404 Not Found`: Canvas cannot find the course.
  - `502 Bad Gateway`: The Canvas request fails.

---

### Course workload

- `GET /api/workload/courses` returns active Canvas courses and grades, alongside the signed-in student’s saved credit hours and `hidden` flag for each course.
- Add `?includeAssignmentPreferences=true` to include the signed-in student's `focusedAssignments`, `dismissedAssignments`, and personal `timeReports`.
- `PUT /api/workload/assignments/focus` accepts `courseId`, `assignmentId`, and a boolean `focused`. It sets membership in the signed-in student's focus list and returns `{ "focused": true }` or `{ "focused": false }`.
- `PUT /api/workload/assignments/dismissal` accepts `courseId`, `assignmentId`, and a boolean `dismissed`. It returns the saved entry as `dismissedAssignment`, or `null` after a restore. Restore also works after a course becomes inactive.
- `PUT /api/workload/courses/:courseID/visibility` accepts `{"hidden": true}` to hide the course or `{"hidden": false}` to show it. This preference applies to the workload map.
- `PUT /api/workload/courses/:courseID/credits` accepts `{"creditHours": 3}` and saves that student's credit hours for the course.
- `PUT /api/workload/courses/:courseID/assignments/:assignmentID/time` accepts `{"minutes": 75}`. Saving again replaces the student's previous report and returns the updated estimate and report count.
- `DELETE /api/workload/courses/:courseID/assignments/:assignmentID/time` removes the signed-in student's report and returns the updated estimate and report count.

---

### `POST /api/submissions`
- **Description**: Retrieves student assignment submissions and scores for a course.
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token", "courseID": "265289" }
  ```

---

### `POST /api/me`
- **Description**: Returns the student's personal profile (name, ID).
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token" }
  ```

---

### `POST /api/dashboard`
- **Description**: Unified aggregation endpoint returning user profile, enrolled courses, and grade info in one response.
- **Request Body**:
  ```json
  { "apiKey": "canvas_bearer_token" }
  ```
- **Response**: `200 OK`
  ```json
  {
    "firstname": "John",
    "lastname": "Doe",
    "courses": [ ... ],
    "gradeinfo": [ ... ]
  }
  ```
