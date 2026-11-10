# Backend Overview & Architecture

> **Axiom Server**: Express 5 + TypeScript REST API powering student data ingestion, encrypted storage, Canvas LMS communication, and high-performance computation.

---

## High-Level Architecture

The Axiom backend acts as an intermediary between university learning management systems (specifically Canvas LMS), a secure PostgreSQL database, and the Next.js frontend client.

```
                           +------------------------+
                           |  Canvas LMS REST API   |
                           | (or MockCanvasClient)  |
                           +-----------+------------+
                                       |
                                       v
+---------------+        +-------------+------------+        +--------------------+
|               |  JSON  |                          | SQL/pg |                    |
|   Frontend    |<------>|   Express 5 REST API     |<------>|     PostgreSQL     |
|  (Next.js 16) |        |  - Auth & Verify Routes  |        | (Encrypted Tables) |
|               |        |  - Data Mapper & Cache   |        +--------------------+
+---------------+        |  - C++ Native Engine     |
                         +-------------+------------+
                                       |
                                       v
                         +-------------+------------+
                         |  AES-256-GCM / HMAC-256  |
                         |   Crypto Service Layer   |
                         +--------------------------+
```

---

## Core Subsystems

The backend is organized into six major functional components:

### 1. Incoming Data: Canvas Client (`src/client/`)
- Interacts with Canvas LMS REST endpoints (`/api/v1/users/self`, `/api/v1/courses`, assignments, and submissions).
- **Offline Mocking**: Contains a full `MockCanvasClient` that implements the same interface with pre-seeded UNC Charlotte course and grade fixtures, enabling tests and demonstrations without live Canvas credentials.
- Read more: [Canvas Client Documentation](./canvas-client.md)

### 2. Storing Data: PostgreSQL & Database Service (`src/services/`)
- Automatically initializes 8 relational tables on server startup (`Users`, `User_Api_Keys`, `User_Info`, `Course`, `User_Courses`, `Assignment`, `Submission`, `Updates`).
- Implements intelligent caching: uses a 20-minute threshold (`lastUpdated`) to prevent hitting Canvas rate limits when data was recently synced.
- Read more: [Database Documentation](./database.md)

### 3. Data Security & Cryptography (`src/crypto/`)
- Employs **AES-256-GCM** authenticated encryption to encrypt sensitive student attributes (user IDs, API keys, assignment scores, and course grades).
- Utilizes **HMAC-SHA256** deterministic hashing for database primary keys (`userID BYTEA`), preventing student enumeration even if the database is exposed.
- Read more: [Cryptography Documentation](./cryptography.md)

### 4. Data Mapping & Normalization (`src/mapper/`)
- Cleans and strips raw Canvas API responses.
- Extracts course codes, terms, departments, points possible, submission workflow states, and grade percentages into typed schemas (`CleanCourse`, `CleanCourseAssignment`).
- Read more: [Data Mapper Documentation](./data-mapper.md)

### 5. Outgoing Data: REST API Routes (`src/routes/`)
- Express 5 controllers providing standard JSON endpoints for the frontend:
  - `/api/verify`: Verifies student Canvas tokens.
  - `/api/courses` & `/api/course`: Retrieves course catalogs and enrollment details.
  - `/api/assignments` & `/api/assignment`: Retrieves syllabus items and deadlines.
  - `/api/submissions`: Retrieves grades and submission records.
  - `/api/me`: Returns personal student profile data.
  - `/api/dashboard`: Aggregated dashboard payload.
- Read more: [Routes API Documentation](./routes-api.md)

### 6. Computation Engine (`cpp_engine/`)
- Native C++ addon using Node-API (`node-addon-api`) and built via `binding.gyp`.
- Engineered to handle CPU-intensive relational calculations, GPA simulation matrices, and physics node physics without blocking the Node.js event loop.

---

## Directory Layout

```
apps/api/backend/
├── binding.gyp              # node-gyp build manifest for C++ addon
├── cpp_engine/
│   ├── CMakeLists.txt
│   ├── main.cpp
│   └── src/
│       └── addon.cc         # Native C++ module implementation
├── package.json
├── src/
│   ├── client/              # Canvas API integration & mock client
│   ├── config/              # Configuration & constants
│   ├── crypto/              # AES-256-GCM & HMAC-SHA256 implementation
│   ├── mapper/              # Raw data transformers
│   ├── routes/              # Express API endpoint definitions
│   ├── services/            # Database queries, caching, and engine helpers
│   └── server.ts            # Entrypoint & Express listener
└── tsconfig.json
```
