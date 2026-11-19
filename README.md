# Axiom

Axiom connects to Canvas LMS and helps students decide which assignments matter most for their grades. It is designed to compute:

- **Assignment priority:** deadline urgency, points possible, and estimated effort, with a personalized **For you** view.
- **Projected GPA:** estimated semester and cumulative GPA from current grades and remaining coursework weight.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind v4, Recharts, Canvas 2D |
| Backend | Express 5, TypeScript, PostgreSQL, C++ N-API addon |
| Security | AES-256-GCM (stored credentials), HMAC-SHA256 (lookup indexes) |

```
apps/
├── api/backend/   # Express API, C++ addon (cpp_engine/), src/{client,crypto,mapper,routes,services}
└── web/           # Next.js app: / (auth), /site/dashboard, /mocksite (demo)
docs/              # Backend and frontend deep-dives
```

Docs: [Overview](docs/README.md) · [Backend](docs/backend/README.md) · [Frontend](docs/frontend/README.md)

## Features

- **Canvas integration:** fetches profile, courses, assignments, and submissions. Results are cached for 20 minutes to avoid rate limits.
- **Mock client:** `MockCanvasClient` provides seeded student data so you can demo without a Canvas token.
- **Encrypted storage:** Canvas tokens and identifiers are stored encrypted (AES-256-GCM, random IV per record). Database lookups use deterministic HMAC-SHA256 hashes so raw identifiers are never indexed.

### Assignment Weights & Ranking

The base ranking is a score that combines deadline urgency (65%), Canvas points possible (30%), and estimated effort (5%). Axiom uses the due date or, when it’s missing, the Canvas lock date. Longer assignments get a head start based on the median time reported by students. The **For you** tab prioritizes the assignments with more grade impact in courses where your current grade is lower.

**Chronological** shows the full semester in deadline order, including completed and closed assignments. Use **Add to Focus** to save individual assignments to **My Focus List**.

## Status

**Done**
- Express API with `/healthz` and CORS
- Auto-created PostgreSQL schema (8 tables)
- Crypto layer, Canvas client, mock client
- Auth landing page with token validation
- `/mocksite` sandbox: assignment cards, workload chart, physics graph
- `/site/dashboard` displays Canvas courses and grades
- `/site/assignments` ranks live Canvas assignments and filters them by course

**Roadmap**
- Use the Assignments ranking on the dashboard
- HTTP-only session cookies / JWT instead of sending the token in every request

## Known limitations

- The Canvas token is sent in each request body, which can leak into logs or proxies. Run behind HTTPS anywhere beyond localhost.
- The server decrypts tokens to call Canvas, so encryption protects data at rest only.
- The `mocksite` passkey only unlocks mock data; it grants no access to real backend data.

## Prerequisites

- Node.js 20.9+ and npm
- PostgreSQL 14+
- Python 3 and a C++ toolchain (for `node-gyp`)
  - Ubuntu/Debian: `sudo apt install -y build-essential python3 make g++`
  - macOS: `xcode-select --install`
  - Windows: Visual Studio Build Tools with the "Desktop development with C++" workload

## Setup

**1. Database**

```bash
createdb -U postgres axiom
```

**2. Backend**

```bash
cd apps/api/backend
cp .env.example .env     # then edit the values below
npm install              # also builds the C++ addon
npm run dev
```

Tables are created automatically on first start.

**3. Frontend**

```bash
cd apps/web
npm install
npm run dev              # http://localhost:3000
```

### Environment variables (`apps/api/backend/.env`)

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=axiom

PORT=5000

# Must decode to exactly 32 bytes (Base64 or 64-char hex)
ENCRYPTION_KEY=generate_your_own
# Any long random string
LOOKUP_HMAC_KEY=generate_your_own

# Optional, for live Canvas testing
# CANVAS_API_KEY=
# CANVAS_BASE_URL=https://instructure.charlotte.edu
```

Generate keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The server should refuse to start if either key is missing or still a placeholder.

## Try it

Open http://localhost:3000.

- **Demo (no Canvas account):** enter `mocksite` as the API key. You'll land on `/mocksite` with the assignment list, workload chart, and a draggable physics graph.
- **Live Canvas:** create a token in Canvas under Account → Settings → New Access Token, paste it in, and submit. The backend verifies it, syncs your data, and redirects to `/site/dashboard`.

There are no automated tests yet; testing is manual.

## API

Base URL `http://localhost:5000`. All `/api` routes are `POST` with a JSON body.

| Endpoint | Body | Returns |
|---|---|---|
| `GET /healthz` | none | `{ ok: true, status: "healthy" }` |
| `/api/verify` | `apiKey` | Validates token, records user |
| `/api/me` | `apiKey` | User profile |
| `/api/courses` | `apiKey` | Enrolled courses |
| `/api/course` | `apiKey`, `courseID` | One course |7301~rrLNtRKHrnt7KvuF3mUThmutzcvfQcWPaAumnTtxe7vCxkQywCu42AeATVNkFk8L
| `/api/assignments` | `apiKey`, `courseID` | Course assignments |
| `/api/assignment` | `apiKey`, `courseID`, `assignmentID` | One assignment |
| `/api/submissions` | `apiKey`, `courseID` | Submission states and scores |
| `/api/dashboard` | `apiKey` | Profile, courses, and grades |


## Screenshots

### Login Page

<img width="1887" height="1010" alt="261104_22h16m34s_screenshot" src="https://github.com/user-attachments/assets/e3e05fc9-c6d6-42cc-81f8-e7cbd5273f5d" />

### Dashboard Page

<img width="1886" height="1007" alt="261104_22h17m07s_screenshot" src="https://github.com/user-attachments/assets/ba0a311f-1db5-4c8a-b42e-71bc63ef52dd" />

### Course Overview Page
<img width="1470" height="923" alt="Screenshot 2026-11-19 at 3 52 27 PM" src="https://github.com/user-attachments/assets/6b27e3d9-36f6-4d03-b3f0-175052d4e2db" />

### Assignments Page (Dark Mode)

<img width="1470" height="923" alt="Screenshot 2026-11-19 at 3 51 36 PM" src="https://github.com/user-attachments/assets/dcd787a4-f0eb-4a6c-83a3-61888d656aa0" />





## License

See [LICENSE](LICENSE).
