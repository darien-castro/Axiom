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
