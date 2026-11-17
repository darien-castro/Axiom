# Axiom Documentation

Welcome to the central documentation for **Axiom**, the academic intelligence and course optimization platform.

---

## Architecture Overview

Axiom is built as a decoupled monorepo separating server-side data processing and the client-side user experience:

```
docs/
├── backend/                   # Backend API, Database, Cryptography & C++ Addon
│   ├── README.md              # High-level backend overview & architecture
│   ├── canvas-client.md       # Canvas LMS REST API & Mock Client
│   ├── cryptography.md        # AES-256-GCM encryption & HMAC hashing
│   ├── database.md            # PostgreSQL schema & DatabaseService
│   ├── data-mapper.md         # Canvas payload normalization
│   └── routes-api.md          # Express REST API endpoints
├── frontend/                  # Next.js 16 App Router & UI Client
│   └── README.md              # High-level frontend overview, views & physics engine
├── uml/                       # PlantUML UML diagrams & rendered SVG/PNG assets
│   ├── class-diagram.puml     # Class diagram (.puml & .svg)
│   ├── sequence-diagram.puml  # Sequence diagram (.puml & .svg)
│   └── database-erd.puml      # PostgreSQL ERD diagram (.puml, .svg & .png)
├── database-setup.md          # Database setup instructions & team CRUD verification
└── ai-design-review.md        # AI design decision review & corrections
```

---

## Documentation Sections

### 1. [Backend Documentation](backend/README.md)
Explore the Express 5 + TypeScript server, PostgreSQL relational models, zero-knowledge encryption architecture, Canvas LMS integration, and native C++ computation engine.

- **[Canvas Client](backend/canvas-client.md)**: Communicating with Canvas LMS REST endpoints and offline mock client testing.
- **[Database & Schema](backend/database.md)**: Relational schema, auto-provisioning tables, and data caching.
- **[Cryptography](backend/cryptography.md)**: AES-256-GCM authenticated encryption and HMAC-SHA256 indexing.
- **[Data Mapper](backend/data-mapper.md)**: Sanitizing and transforming external LMS payloads.
- **[Routes API](backend/routes-api.md)**: Complete REST API endpoint reference and payloads.

### 2. [Frontend Documentation](frontend/README.md)
Explore the Next.js 16 (App Router) + React 19 web application, UI design system, state management, and the interactive 2D Canvas physics engine.

- **Gateway & Authentication**: State machine validation for Canvas tokens and evaluator demo bypass (`mocksite`).
- **Dashboard (`/site/dashboard`)**: High-priority assignment impact cards, standing risk analysis, upcoming queue, and GPA projection layout.
- **Mocksite Sandbox (`/mocksite`)**: 2D physics simulation canvas, draggable weighted nodes, and interactive workload analytics.
- **Theme Engine**: Dynamic theme switching (Nord, Forest, Ocean, Twilight, Rose Pine, MacOS).

### 3. [Architecture & UML Diagrams (PlantUML)](uml/)
Visual PlantUML specifications for system components, database ERD, data sync lifecycles, and class structures:

- **[Class Diagram](uml/class-diagram.puml)**: System OOP services, data models, and component relationships ([SVG](uml/class-diagram.svg)).
- **[Sequence Diagram](uml/sequence-diagram.puml)**: User authentication, caching evaluation, and data sync sequence ([SVG](uml/sequence-diagram.svg)).
- **[Database ERD](uml/database-erd.puml)**: PostgreSQL relational schema and Prisma models ([SVG](uml/database-erd.svg), [PNG](uml/dbpuml.png)).

### 4. Setup & Design Reviews
- **[Database Setup Guide](database-setup.md)**: Local PostgreSQL setup, Prisma migrations, and team CRUD verification table.
- **[AI Design Review](ai-design-review.md)**: Evaluation and correction of AI-generated design decisions.
