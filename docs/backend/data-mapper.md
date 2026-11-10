# Data Mapper Documentation

The Data Mapper module (`src/mapper/mapper.ts`) translates polymorphic and verbose Canvas API responses into clean, strongly typed TypeScript entities.

---

## Transformations

### User Information
- Extracts `id`, first name, and last name from `/api/v1/users/self`.
- Splits multi-part names and maps them into `{ userID, firstName, lastName }`.

### Course Data
- Parses course titles (e.g. `202610-Fall 2026-ITCS-3160-001-Database Design`).
- Extracts semester term (`Fall 2026`), course department/code (`ITCS-3160`), section (`001`), and descriptive name (`Database Design`).
- Normalizes grade fields from Canvas enrollment objects (`computed_current_score`, `computed_current_grade`).

### Assignments & Submissions
- Maps Canvas assignment objects to `{ assignmentID, name, type, grade, points, courseID }`.
- Normalizes submission records, parsing ISO 8601 timestamps and scores into consistent strings.
