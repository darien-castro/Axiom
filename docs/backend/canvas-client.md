# Canvas Client Documentation

The Canvas Client module (`src/client/canvasclient.ts`) manages HTTP communication with the Canvas LMS REST API.

---

## Capabilities & Endpoints

| Method | Target Canvas Endpoint | Purpose |
| :--- | :--- | :--- |
| `verifyKey(apiKey)` | `GET /api/v1/users/self` | Validates a student bearer token |
| `GetUserInformation()` | `GET /api/v1/users/self` | Fetches student ID, name, and profile details |
| `GetCourses()` | `GET /api/v1/courses?include[]=total_scores` | Fetches enrolled courses and final grades |
| `GetCourseData(courseID)` | `GET /api/v1/courses/:id?include[]=total_scores` | Fetches details for a specific course |
| `GetCourseAssignments(courseID)` | `GET /api/v1/courses/:id/assignments?per_page=100` | Fetches all assignments, points, and due dates |
| `GetCourseAssignment(cID, aID)` | `GET /api/v1/courses/:id/assignments/:id` | Fetches individual assignment information |
| `GetCourseSubmissions(courseID)` | `GET /api/v1/courses/:id/students/submissions` | Fetches student submissions and scores |
| `GetSubmissionGrade(cID, aID)` | `GET /api/v1/courses/:id/assignments/:id/submissions/self` | Fetches personal submission grade |

---

## Mock Canvas Client (`mockclient.ts`)

For testing and offline evaluation without university credentials, `MockCanvasClient` extends `CanvasClient` and provides deterministic test fixtures:

- **Courses**:
  - `ITCS-3160-001-Database Design` (Fall 2026)
  - `ITCS-3145-002-Parallel Computing` (Fall 2026)
- **User**: John Doe (`jdoe@charlotte.edu`)
- **Assignments & Grades**: Seeded homeworks, projects, and submission scores.
