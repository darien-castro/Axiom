# Database Documentation

The database layer (`src/services/databaseService.ts`, `src/services/db.ts`, and `prisma/schema.prisma`) manages PostgreSQL connections, Prisma ORM models, encrypted storage, and caching.

---

## Connection Configuration

The application uses `PrismaClient` configured via environment variables or `DATABASE_URL`:
- `DATABASE_URL`: Full PostgreSQL connection URL (optional, e.g. `postgresql://user:pass@127.0.0.1:5432/axiom?schema=public`)
- `DB_HOST`: Hostname (default: `127.0.0.1`)
- `DB_PORT`: PostgreSQL port (default: `5432`)
- `DB_USER`: PostgreSQL user (default: `postgres`)
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: Database name (default: `axiom`)

---

## Prisma Schema & Tables

The Prisma schema is located at `apps/api/backend/prisma/schema.prisma`. It models the 9 relational tables:

1. **`User` (`users`)**: Primary student table. Primary key `userID BYTEA` stores the deterministic HMAC-SHA256 hash of the Canvas user ID.
2. **`UserApiKey` (`user_api_keys`)**: Stores AES-256-GCM encrypted Canvas bearer tokens and encrypted user IDs with cascade deletion on user removal.
3. **`UserInfo` (`user_info`)**: Stores first and last names (encrypted) with update timestamps.
4. **`Course` (`course`)**: Stores course metadata (course ID, name, term, term ID, course code, section, department).
5. **`UserCourse` (`user_courses`)**: Many-to-many junction table recording course enrollments and encrypted course letter/numerical grades.
6. **`Assignment` (`assignment`)**: Stores assignment IDs, titles, types, grade points possible, and foreign key references to `Course`.
7. **`Submission` (`submission`)**: Stores submission timestamps, scores, and grading states.
8. **`Update` (`updates`)**: Logs the timestamp of the last successful sync with Canvas for each user.
9. **`Session` (`sessions`)**: Stores session keys and Canvas API tokens.

### Prisma CLI Commands

In `apps/api/backend`:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema changes directly to the database
npm run prisma:push

# Run migrations in development
npm run prisma:migrate
```

---

## Caching Strategy

To prevent Canvas API rate-limiting, `isGreaterThan20MinsApart(now, lastUpdate)` inspects the `Updates` table:
- If less than 20 minutes have elapsed since the last sync, cached records from PostgreSQL are served immediately.
- If more than 20 minutes have elapsed or no record exists, the server queries Canvas, updates the database via Prisma, and bumps the `Updates` timestamp.
