# Database Setup & Documentation

The database layer (`apps/api/backend/src/services/databaseService.ts`, `apps/api/backend/src/services/db.ts`, and `apps/api/backend/prisma/schema.prisma`) manages PostgreSQL connections, Prisma ORM models, migrations, zero-knowledge encryption, and rate-limited caching.

---

## 1. Local Database Setup Instructions

### Prerequisites
- PostgreSQL 14+ installed and running locally
- Node.js 20.9+ and npm

### Database Initialization
```bash
# 1. Create the PostgreSQL database (run via psql or terminal)
createdb -U postgres axiom

# 2. Configure environment variables in apps/api/backend/.env
cd apps/api/backend
cp .env.example .env
```

Ensure your `.env` contains:
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=axiom
DATABASE_URL="postgresql://your_postgres_username:your_postgres_password@127.0.0.1:5432/axiom?schema=public"

# 32-byte Base64 key
ENCRYPTION_KEY=jZalr1MqFbyvLYKP65v2FW9Lduj7wJbUbHBfTTx7HdQ=
LOOKUP_HMAC_KEY=your_secure_hmac_key_here
```

### Prisma Client & Migration Setup
```bash
# Generate the Prisma Client
npm run prisma:generate

# Apply migrations to local database
npm run prisma:migrate
```

---

## 2. Team CRUD Verification Table

The following verification protocol confirms multi-user database consistency across team members without exposing database credentials:

| Step | Team Role | Action | Operation | Verification Criteria | Status |
|---|---|---|---|---|---|
| **1. Create** | **Member A** | Registers student profile and course records via `pushGeneralUserInfo` and `pushCourseInformation` | **CREATE** | Record created in `users` with HMAC-SHA256 hashed ID and `course` with valid `courseID`. | Verified |
| **2. Read** | **Member B** | Connects to shared/replicated DB and queries student courses via `getUserCourses` and profile via `getUserInfo` | **READ** | Student name decrypts cleanly from AES-256-GCM ciphertext; all enrolled classes returned. | Verified |
| **3. Update** | **Member C** | Updates student course grade and sync timestamp via `pushGradeInformation` and `syncUpdate` | **UPDATE** | Updated letter grade and percentage reflected in `user_courses`; new timestamp in `updates`. | Verified |
| **4. Delete** | **Member A** | Destroys active session via `deleteSessionKey` and runs test cleanup | **DELETE** | Session invalidated (`isSessionValid` returns `false`); test records removed cleanly. | Verified |

---

## 3. Prisma Schema & Tables

The Prisma schema is located at `apps/api/backend/prisma/schema.prisma`. It models 9 relational tables:

1. **`User` (`users`)**: Primary student table. Primary key `userID BYTEA` stores the deterministic HMAC-SHA256 hash of the Canvas user ID.
2. **`UserApiKey` (`user_api_keys`)**: Stores AES-256-GCM encrypted Canvas bearer tokens and encrypted user IDs with cascade deletion on user removal.
3. **`UserInfo` (`user_info`)**: Stores first and last names (encrypted) with update timestamps.
4. **`Course` (`course`)**: Stores course metadata (course ID, name, term, term ID, course code, section, department).
5. **`UserCourse` (`user_courses`)**: Many-to-many junction table recording course enrollments and encrypted course letter/numerical grades.
6. **`Assignment` (`assignment`)**: Stores assignment IDs, titles, types, grade points possible, and foreign key references to `Course`.
7. **`Submission` (`submission`)**: Stores submission timestamps, scores, and grading states.
8. **`Update` (`updates`)**: Logs the timestamp of the last successful sync with Canvas for each user.
9. **`Session` (`sessions`)**: Stores session keys and Canvas API tokens.

### Migration History

Initial migration is tracked at [`apps/api/backend/prisma/migrations/0_init/migration.sql`](file:///home/pablovepo/main/githubProjs/Axiom-new/apps/api/backend/prisma/migrations/0_init/migration.sql).

---

## 4. Running Automated Database Tests

The backend uses **Vitest** for automated user journey and error-handling testing:

```bash
cd apps/api/backend
npm test
```
