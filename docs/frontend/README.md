# Frontend Overview & Architecture

> **Axiom Web Application**: Next.js 16 (App Router) + React 19 client providing intelligent academic workload visualization, grade forecasting, and an interactive 2D Canvas physics engine.

---

## High-Level Architecture

The frontend is built using Next.js 16 with React 19 and Tailwind CSS v4. It features a reactive UI that dynamically transforms LMS data into actionable priority insights.

```
                              +---------------------------+
                              |    Next.js 16 Frontend    |
                              |   (React 19 / Tailwind)   |
                              +-------------+-------------+
                                            |
         +----------------------------------+----------------------------------+
         |                                  |                                  |
         v                                  v                                  v
+-------------------+             +-------------------+              +-------------------+
|   Landing Gate    |             |     Dashboard     |              | Mocksite Sandbox  |
|    (`app/page`)   |             | (`site/dashboard`)|              |   (`mocksite/`)   |
| - Token validation|             | - High-impact card|              | - Physics engine  |
| - State machine   |             | - Upcoming queue  |              | - Interactive chart|
| - Demo bypass     |             | - Projected GPA   |              | - Workload feed   |
+-------------------+             +-------------------+              +-------------------+
```

---

## Key Views & Workflows

### 1. Landing & Authentication Gate (`app/page.tsx`)
- **Interactive State Machine**: Manages validation states (`idle` -> `loading` -> `success` / `error`).
- **Smooth Animations**: Animated expandable card with tactile button feedback.
- **Evaluator Demo Passkey**: Typing `mocksite` into the API key field bypasses the live Canvas requirement and immediately launches the demonstration workspace (`/mocksite`).
- **Live Verification**: Submits real Canvas bearer tokens to `http://localhost:5000/api/verify` before redirecting to `/site/dashboard`.

---

### 2. Main Academic Dashboard (`app/site/dashboard/page.tsx`)
- **Status Bar**: Real-time indicators showing active semester (e.g. *Fall 2026*) and total enrolled course counts.
- **Featured Next Important Assignment**:
  - Highlights the highest-priority coursework item based on its grade impact percentage (e.g., *Affects 20% of Grade*).
  - Displays estimated time required, assignment categorization (e.g., *Major Project*), and standing risk metrics (*"Drops to < B if < 70%"*).
- **Projected GPA Card**:
  - Visual gauge layout displaying the mathematical input requirements for cumulative and semester GPA forecasting.
- **Canvas-Synced Queue**:
  - Subsequent upcoming assignments sorted by priority and due dates.

---

### 3. Interactive Mocksite & Physics Sandbox (`app/mocksite/`)
A playground environment designed for evaluation, feature testing, and visual workload analysis:

- **Assignment Card Feed (`components/custom/AssignmentCard.tsx`)**:
  - Priority badges (`Heavy`, `Medium`, `Light`, `Optional`).
  - Grade impact tags (e.g. `Affect 15%`), estimated completion times, and due date countdowns.
- **Interactive Workload Chart (`components/custom/BubbleChart.tsx`)**:
  - Built with Recharts to display interactive time distributions and deadline clusters.
- **2D Canvas Physics Engine (`components/physicsview.tsx` & `engine.ts`)**:
  - Custom HTML5 Canvas physics simulation.
  - Courses and assignments are modeled as floating, gravitational nodes (`physNode`).
  - **Dynamic Mass & Radius**: Scaled by course credit weight (`course.credits + 1`).
  - **Health Color-Coding**: Muted emerald for good standing, coral/red for courses with low grades.
  - **Interactivity**: Full mouse drag-and-drop physics with real-time velocity dampening and collision boundaries.

---

### 4. Design System & Theme Engine

The frontend incorporates custom CSS color palette themes configurable via class toggles:
- **Nord**
- **Forest**
- **Ocean**
- **Twilight**
- **Rose Pine**
- **MacOS**

All primitives adhere to Tailwind CSS v4 variable standards and Shadcn UI conventions (`components/ui/`).

---

## Directory Structure

```
apps/web/
├── app/
│   ├── dashboard/             # Legacy dashboard layout
│   ├── mocksite/              # Sandbox view & 2D physics engine
│   │   ├── components/
│   │   │   ├── engine.ts      # Physics simulation logic
│   │   │   └── physicsview.tsx# HTML5 Canvas component
│   │   └── page.tsx           # Mocksite layout & mock assignment feed
│   ├── site/
│   │   ├── dashboard/         # Main academic dashboard view
│   │   └── settings/          # User preferences
│   ├── themes/                # Custom CSS theme palettes
│   ├── layout.tsx             # Root layout & font loading
│   └── page.tsx               # Entry login / verification gate
├── components/
│   ├── custom/                # AssignmentCard, BubbleChart, Navbar
│   └── ui/                    # Shadcn UI primitives (button, card, badge, etc.)
├── lib/
│   └── utils.ts               # Class merging (cn) helpers
└── package.json
```
