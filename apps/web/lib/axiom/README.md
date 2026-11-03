# Frontend integration points

The `/mocksite` experience deliberately runs without credentials or network calls.
`api.ts` is the boundary: `getDashboardData()` currently resolves the fixtures in
`demo.ts`. The login uses `connectCanvasDemo()` and never accepts a real key.

When connecting Django:

1. Replace the login placeholder with token validation against `GET /api/courses/`.
   Decide session/token handling first. Do not embed a token in public env vars.
2. Replace `getDashboardData()` with requests to the existing routes listed in
   `canvasEndpoints`, passing `Authorization: Bearer <token>` on each request.
3. Adapt the actual Canvas response to UI records. `CanvasAssignment` documents
   the current assignment payload. Use compound course/assignment identities,
   handle null dates/grades, and use the backend timezone for display.
4. The backend selects to-do plus unfinished undated assignments; it does not
   currently provide the complete assignment history or completion totals.
5. Remove demo labels only after real data is connected. Handle 401/403/429 and
   loading/empty/error states. Avoid frequent polling of Canvas.

The demo `weight`, `change`, `hours`, `load`, grade letters, GPA chart, and recommended
order are fixtures, not Canvas calculations. Backend `group_weight` is the weight
of an entire category; do not map it to an individual assignment's `weight`.
Ranking, workload analysis, history, projections, and simulation APIs are deferred.
No endpoint for those features is assumed or called. Arrow ordering and filters
operate locally and reset on navigation/reload. Chart ranges switch sample curves.

Routes: `/` (connection placeholder), `/mocksite` (overview),
`/mocksite/assignments`, `/mocksite/courses`, `/mocksite/history`,
`/mocksite/simulation`. The latter two intentionally show future-feature states.
