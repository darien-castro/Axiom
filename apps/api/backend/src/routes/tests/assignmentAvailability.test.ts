import { once } from 'node:events';
import type { Server } from 'node:http';
import cookieSession from 'cookie-session';
import express from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import assignmentsRoute from '../assignments';
import courseWorkloadRoute from '../courseWorkload';
import verifyRoute from '../verify';

const sessions = new Map<string, string>();
const workloadDb = vi.hoisted(() => ({
  saveCourseCreditHours: vi.fn(),
  saveAssignmentTimeReport: vi.fn(),
  saveCourseVisibility: vi.fn(),
  getHiddenCourses: vi.fn(),
}));
vi.mock('../../services/databaseService', () => ({
  default: {
    ...workloadDb,
    insertSessionKey: async (sessionKey: string, apiKey: string) => { sessions.set(sessionKey, apiKey); },
    getSessionApiKey: async (sessionKey: string) => sessions.get(sessionKey) ?? null,
    getCourseCreditHours: async () => [{ courseId: '42', creditHours: 3.5 }],
    getAssignmentTimeEstimates: async () => [{ assignmentId: '7', estimatedMinutes: 75, reportCount: 3 }],
  },
}));

const localFetch = globalThis.fetch;
const canvasFetch = vi.fn<typeof fetch>();
const canvasUrl = 'https://instructure.charlotte.edu/api/v1';
const firstPage = `${canvasUrl}/courses/42/assignments?per_page=100&include[]=submission`;
let server: Server;
let apiUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(cookieSession({ name: 'AxiomCookie', keys: ['test-session-key'] }));
  app.use(express.json());
  app.use('/api', verifyRoute, courseWorkloadRoute, assignmentsRoute);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server is unavailable');
  apiUrl = `http://127.0.0.1:${address.port}/api`;
});

beforeEach(() => {
  sessions.clear();
  canvasFetch.mockReset();
  vi.clearAllMocks();
  workloadDb.getHiddenCourses.mockResolvedValue([]);
  vi.stubGlobal('fetch', canvasFetch);
});

afterEach(() => vi.unstubAllGlobals());

afterAll(async () => {
  if (server?.listening) {
    server.close();
    await once(server, 'close');
  }
});

async function signIn(apiKey: string): Promise<string> {
  const response = await localFetch(`${apiUrl}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  expect(response.status).toBe(200);
  return response.headers.getSetCookie().map((cookie) => cookie.split(';', 1)[0]).join('; ');
}

function getAvailability(headers?: Record<string, string>) {
  return localFetch(`${apiUrl}/courses/42/assignments/availability`, { headers });
}

test('requires authentication before calling Canvas', async () => {
  const response = await getAvailability();
  expect(response.status).toBe(401);
  expect(canvasFetch).not.toHaveBeenCalled();
});

test('returns all pages with separate effective dates for each signed-in student', async () => {
  const secondPage = `${canvasUrl}/courses/42/assignments?page=opaque`;
  canvasFetch.mockImplementation(async (url, options) => {
    if (url === `${canvasUrl}/users/self`) return Response.json({ id: 1 });

    const authorization = new Headers(options?.headers).get('Authorization');
    expect(authorization).toMatch(/^Bearer student-[ab]$/);
    if (url === secondPage) {
      return Response.json([{ id: 8, name: 'No dates', locked_for_user: true, submission: { workflow_state: 'graded' } }]);
    }

    expect(url).toBe(firstPage);
    return Response.json([{
      id: 7,
      name: 'Lab report',
      unlock_at: '2026-11-19T15:00:00Z',
      due_at: authorization === 'Bearer student-a' ? '2026-11-20T23:00:00Z' : '2026-11-22T23:00:00Z',
      lock_at: '2026-11-23T23:00:00Z',
      locked_for_user: false,
      submission: { workflow_state: 'graded', missing: true },
    }], { headers: { Link: `<${firstPage}>; rel="current", <${secondPage}>; rel="next"` } });
  });

  const studentA = await signIn('student-a');
  const studentB = await signIn('student-b');
  const [responseA, responseB] = await Promise.all([
    getAvailability({ Cookie: studentA }),
    getAvailability({ Cookie: studentB }),
  ]);

  expect(responseA.status).toBe(200);
  expect(responseB.status).toBe(200);
  expect(responseA.headers.get('Cache-Control')).toBe('private, no-store');
  expect(await responseA.json()).toEqual({ assignments: [
    {
      assignmentId: '7', assignmentName: 'Lab report', availableFrom: '2026-11-19T15:00:00Z',
      dueAt: '2026-11-20T23:00:00Z', availableUntil: '2026-11-23T23:00:00Z', lockedForUser: false,
      outstanding: true, estimatedMinutes: 75, reportCount: 3,
    },
    {
      assignmentId: '8', assignmentName: 'No dates', availableFrom: null,
      dueAt: null, availableUntil: null, lockedForUser: true,
      outstanding: false, estimatedMinutes: null, reportCount: 0,
    },
  ] });
  expect(await responseB.json()).toMatchObject({ assignments: [
    { dueAt: '2026-11-22T23:00:00Z' },
    { assignmentId: '8' },
  ] });
  expect(canvasFetch).toHaveBeenCalledTimes(6);
});

test.each([[401, 401], [403, 403], [404, 404], [500, 502]])(
  'maps Canvas %i to HTTP %i without forwarding its response body',
  async (canvasStatus, expectedStatus) => {
    canvasFetch.mockResolvedValueOnce(new Response('Internal Canvas details', { status: canvasStatus }));
    const response = await getAvailability({ 'X-API-Key': 'student-a' });

    expect(response.status).toBe(expectedStatus);
    expect(await response.text()).not.toContain('Internal Canvas details');
  },
);

test('does not forward the Canvas token to a different pagination origin', async () => {
  canvasFetch.mockResolvedValueOnce(Response.json([], {
    headers: { Link: '<https://example.test/assignments?page=2>; rel="next"' },
  }));
  const response = await getAvailability({ 'X-API-Key': 'student-a' });

  expect(response.status).toBe(502);
  expect(canvasFetch).toHaveBeenCalledTimes(1);
});

test('returns active Canvas courses and restricts workload writes to the student’s courses', async () => {
  canvasFetch.mockImplementation(async (url) => {
    if (url === `${canvasUrl}/users/self`) return Response.json({ id: 100 });
    if (url === `${canvasUrl}/courses/42/assignments/7`) return Response.json({ id: 7 });
    expect(String(url)).toContain('enrollment_state=active&enrollment_type=student');
    return Response.json([{
      id: 42, name: '202680-Fall 2026-ITCS-3160-001-Database Design',
      enrollments: [{ type: 'student', computed_current_score: 92 }],
    }]);
  });
  const cookie = await signIn('student-a');
  const base = `${apiUrl}/workload/courses`;
  const get = await localFetch(base, { headers: { Cookie: cookie } });
  expect(get.status).toBe(200);
  expect(await get.json()).toMatchObject({ courses: [{ courseId: '42', courseName: 'Database Design', gradeScore: 92, creditHours: 3.5, hidden: false }] });

  function put(path: string, body: object) {
    return localFetch(`${base}/${path}`, { method: 'PUT', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  expect((await put('43/credits', { creditHours: 4 })).status).toBe(404);
  expect(workloadDb.saveCourseCreditHours).not.toHaveBeenCalled();
  expect((await put('42/credits', { creditHours: 4 })).status).toBe(200);
  expect(workloadDb.saveCourseCreditHours).toHaveBeenCalledWith('100', '42', 4);

  const feedback = await put('42/assignments/7/time', { minutes: 75 });
  expect(feedback.status).toBe(200);
  expect(await feedback.json()).toEqual({ estimatedMinutes: 75, reportCount: 3 });
  expect(workloadDb.saveAssignmentTimeReport).toHaveBeenCalledWith('100', '42', '7', 75);

  expect((await put('43/visibility', { hidden: true })).status).toBe(404);
  expect((await put('42/visibility', { hidden: 'true' })).status).toBe(400);
  expect(workloadDb.saveCourseVisibility).not.toHaveBeenCalled();
  expect(await (await put('42/visibility', { hidden: true })).json()).toEqual({ hidden: true });
  expect(workloadDb.saveCourseVisibility).toHaveBeenCalledWith('100', '42', true);
  workloadDb.getHiddenCourses.mockResolvedValueOnce([{ courseId: '42' }]);
  const updated = await localFetch(base, { headers: { Cookie: cookie } });
  expect(await updated.json()).toMatchObject({ courses: [{ courseId: '42', hidden: true }] });
  expect(workloadDb.getHiddenCourses).toHaveBeenCalledWith('100');

  expect(await (await put('42/visibility', { hidden: false })).json()).toEqual({ hidden: false });
  expect(workloadDb.saveCourseVisibility).toHaveBeenCalledWith('100', '42', false);
});
