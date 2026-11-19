import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type RequestStub = { apiKey: string; body: { apiKey: string }; params: { courseID: string; assignmentID: string } };
type ResponseStub = { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> };
type Handler = (request: RequestStub, response: ResponseStub) => Promise<void>;

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, Handler>(),
  list: vi.fn(), single: vi.fn(),
}));

vi.mock('express', () => ({
  Router: () => ({
    use: vi.fn(),
    get: (path: string, handler: Handler) => mocks.handlers.set(`GET ${path}`, handler),
    post: (path: string, handler: Handler) => mocks.handlers.set(`POST ${path}`, handler),
  }),
}));
vi.mock('../../services/routeService', () => ({ default: {
  userRequestedAssignmentsRoute: mocks.list,
  userRequestedAssignmentRoute: mocks.single,
} }));
vi.mock('../../middleware/auth', () => ({ default: vi.fn() }));
vi.mock('../../services/db', () => { throw new Error('Real database must not load'); });

import '../assignments';
import '../assignment';

const routes = [
  { route: 'GET /courses/:courseID/assignments', service: mocks.list, message: 'Failed to retrieve assignments', payload: { cleanAssignments: [{ assignmentName: 'Homework' }] }, result: [{ assignmentName: 'Homework' }] },
  { route: 'POST /courses/:courseID/assignments', service: mocks.list, message: 'Failed to retrieve assignments', payload: { cleanAssignments: [{ assignmentName: 'Homework' }] }, result: [{ assignmentName: 'Homework' }] },
  { route: 'POST /courses/:courseID/:assignmentID', service: mocks.single, message: 'Failed to retrieve assignment', payload: { assignments: { id: 'assignment-1' } }, result: { id: 'assignment-1' } },
];

beforeEach(() => {
  mocks.list.mockReset();
  mocks.single.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe.each(routes)('$route', ({ route, service, message, payload, result }) => {
  const request: RequestStub = { apiKey: 'synthetic-key', body: { apiKey: 'synthetic-key' }, params: { courseID: 'course-1', assignmentID: 'assignment-1' } };

  function response(): ResponseStub {
    return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() };
  }

  it('returns a generic HTTP 500 for propagated persistence errors', async () => {
    const sensitiveDetails = 'SYNTHETIC_DB_PASSWORD private_table INSERT secret_value';
    service.mockRejectedValue(new Error(sensitiveDetails));
    const reply = response();
    const handler = mocks.handlers.get(route);
    expect(handler).toBeDefined();
    await handler!(request, reply);

    expect(reply.status).toHaveBeenCalledExactlyOnceWith(500);
    expect(reply.json).toHaveBeenCalledExactlyOnceWith({ error: message });
    expect(reply.send).not.toHaveBeenCalled();
    expect(JSON.stringify(reply.json.mock.calls)).not.toContain(sensitiveDetails);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(sensitiveDetails);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(request.apiKey);
  });

  it('preserves successful response payloads', async () => {
    service.mockResolvedValue(result);
    const reply = response();
    await mocks.handlers.get(route)!(request, reply);
    expect(reply.send).toHaveBeenCalledExactlyOnceWith(payload);
    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.json).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
});
