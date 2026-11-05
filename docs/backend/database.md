# Database Documentation

The database layer (`src/services/databaseService.ts` and `src/services/db.ts`) manages PostgreSQL connections, automatic table provisioning, encrypted storage, and caching.

---

## Connection Configuration

The application uses `pg.Pool` configured via environment variables:
- `DB_HOST`: Hostname (default: `127.0.0.1`)
- `DB_PORT`: PostgreSQL port (default: `5432`)
- `DB_USER`: PostgreSQL user
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: Database name (default: `axiom`)

---

## Schema & Tables

When the server starts, `db.initAllTables()` executes `CREATE TABLE IF NOT EXISTS` queries for:

1. **`Users`**: Primary student table. Primary key `userID BYTEA` stores the deterministic HMAC-SHA256 hash of the Canvas user ID.
2. **`User_Api_Keys`**: Stores AES-256-GCM encrypted Canvas bearer tokens and encrypted user IDs with cascade deletion on user removal.
3. **`User_Info`**: Stores first and last names with update timestamps.
4. **`Course`**: Stores course metadata (course ID, name, term, term ID, course code, section, department).
5. **`User_Courses`**: Many-to-many junction table recording course enrollments and encrypted course letter/numerical grades.
6. **`Assignment`**: Stores assignment IDs, titles, types, grade points possible, and foreign key references to `Course`.
7. **`Submission`**: Stores submission timestamps, scores, and grading states.
8. **`Updates`**: Logs the timestamp of the last successful sync with Canvas for each user.

---

## Caching Strategy

To prevent Canvas API rate-limiting, `isGreaterThan20MinsApart(now, lastUpdate)` inspects the `Updates` table:
- If less than 20 minutes have elapsed since the last sync, cached records from PostgreSQL are served immediately.
- If more than 20 minutes have elapsed or no record exists, the server queries Canvas, updates the database, and bumps the `Updates` timestamp.
