# Axiom

Axiom connects to Canvas LMS and helps students decide which assignments matter most for their grades. It is designed to compute:

- **Assignment priority:** urgency × grade weight.
- **Projected GPA:** estimated semester and cumulative GPA from current grades and remaining coursework weight.

> **Status:** prototype. The dashboard currently uses static data and priority ranking is not yet automated. See [Status](#status).

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

## Status

**Done**
- Express API with `/healthz` and CORS
- Auto-created PostgreSQL schema (8 tables)
- Crypto layer, Canvas client, mock client
- Auth landing page with token validation
- `/mocksite` sandbox: assignment cards, workload chart, physics graph
- `/site/dashboard` UI prototype (static data)

**Roadmap**
- Connect dashboard to `POST /api/dashboard`
- Automated weight × urgency ranking from Canvas assignment groups
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

PORT=5000                # macOS: AirPlay Receiver may use 5000; pick another port if so

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
| `/api/course` | `apiKey`, `courseID` | One course |
| `/api/assignments` | `apiKey`, `courseID` | Course assignments |
| `/api/assignment` | `apiKey`, `courseID`, `assignmentID` | One assignment |
| `/api/submissions` | `apiKey`, `courseID` | Submission states and scores |
| `/api/dashboard` | `apiKey` | Profile, courses, and grades |

## License

See [LICENSE](LICENSE).
