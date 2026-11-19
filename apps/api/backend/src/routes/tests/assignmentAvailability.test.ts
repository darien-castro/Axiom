import { once } from 'node:events';
import type { Server } from 'node:http';
import cookieSession from 'cookie-session';
import express from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import assignmentsRoute from '../assignments';
import verifyRoute from '../verify';

const sessions = new Map<string, string>();
vi.mock('../../services/databaseService', () => ({
  default: {
    insertSessionKey: async (sessionKey: string, apiKey: string) => { sessions.set(sessionKey, apiKey); },
    getSessionApiKey: async (sessionKey: string) => sessions.get(sessionKey) ?? null,
  },
}));

const localFetch = globalThis.fetch;
const canvasFetch = vi.fn<typeof fetch>();
const canvasUrl = 'https://instructure.charlotte.edu/api/v1';
const firstPage = `${canvasUrl}/courses/42/assignments?per_page=100`;
let server: Server;
let apiUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(cookieSession({ name: 'AxiomCookie', keys: ['test-session-key'] }));
  app.use(express.json());
  app.use('/api', verifyRoute, assignmentsRoute);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server is unavailable');
  apiUrl = `http://127.0.0.1:${address.port}/api`;
});

beforeEach(() => {
  sessions.clear();
  canvasFetch.mockReset();
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
      return Response.json([{ id: 8, name: 'No dates', locked_for_user: true }]);
    }

    expect(url).toBe(firstPage);
    return Response.json([{
      id: 7,
      name: 'Lab report',
      unlock_at: '2026-11-19T15:00:00Z',
      due_at: authorization === 'Bearer student-a' ? '2026-11-20T23:00:00Z' : '2026-11-22T23:00:00Z',
      lock_at: '2026-11-23T23:00:00Z',
      locked_for_user: false,
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
    },
    {
      assignmentId: '8', assignmentName: 'No dates', availableFrom: null,
      dueAt: null, availableUntil: null, lockedForUser: true,
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
