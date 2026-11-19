import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: {
    getUserIDByApiKey: vi.fn(), lastUpdated: vi.fn(), getUserInfo: vi.fn(),
    getAssignments: vi.fn(), getAssignment: vi.fn(), pushAssignments: vi.fn(),
    syncUpdate: vi.fn(), pushGeneralUserInfo: vi.fn(),
  },
  list: vi.fn(), single: vi.fn(), verify: vi.fn(), profile: vi.fn(),
}));

vi.mock('../databaseService', () => ({ default: mocks.db }));
vi.mock('../db', () => { throw new Error('Real database module must not load'); });
vi.mock('../../client/canvasclient', () => ({
  CanvasClient: class {
    m_apiKey = '';
    GetCourseAssignments = mocks.list;
    GetCourseAssignment = mocks.single;
    verifyKey = mocks.verify;
    GetUserInformation = mocks.profile;
  },
}));

import { userRequestedAssignmentRoute, userRequestedAssignmentsRoute } from '../routeService';

const assignment = { id: 'assignment-1', course_id: 'course-1', name: 'Homework', grading_type: 'points', points_possible: 10 };
const cleanAssignment = { courseId: 'course-1', assignmentName: 'Homework', assignmentType: 'points', assignmentPoints: 10 };
const callers = [
  { name: 'list', call: () => userRequestedAssignmentsRoute('synthetic-key', 'course-1'), expected: [cleanAssignment] },
  { name: 'individual', call: () => userRequestedAssignmentRoute('synthetic-key', 'course-1', 'assignment-1'), expected: assignment },
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.db.getUserIDByApiKey.mockResolvedValue('user-1');
  mocks.db.lastUpdated.mockImplementation(async () => new Date());
  mocks.db.getUserInfo.mockResolvedValue({ firstName: 'Test' });
  mocks.db.getAssignments.mockResolvedValue([]);
  mocks.db.getAssignment.mockResolvedValue(null);
  mocks.db.pushAssignments.mockResolvedValue(undefined);
  mocks.db.syncUpdate.mockResolvedValue(undefined);
  mocks.list.mockResolvedValue([assignment]);
  mocks.single.mockResolvedValue(assignment);
});

describe.each(callers)('$name assignment synchronization', ({ call, expected }) => {
  it('waits for persistence before recording sync and preserves the response', async () => {
    let finishWrite!: () => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => { markStarted = resolve; });
    const pending = new Promise<void>((resolve) => { finishWrite = resolve; });
    mocks.db.pushAssignments.mockImplementation(() => { markStarted(); return pending; });

    const result = call();
    await started;
    expect(mocks.db.syncUpdate).not.toHaveBeenCalled();
    finishWrite();
    await expect(result).resolves.toEqual(expected);
    expect(mocks.db.pushAssignments).toHaveBeenCalledWith('course-1', [assignment]);
    expect(mocks.db.syncUpdate).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it('propagates persistence failure without recording assignment sync', async () => {
    const failure = new Error('Synthetic write failure');
    mocks.db.pushAssignments.mockRejectedValue(failure);
    await expect(call()).rejects.toBe(failure);
    expect(mocks.db.syncUpdate).not.toHaveBeenCalled();
  });

  it('returns cache hits without Canvas requests, writes, or sync updates', async () => {
    mocks.db.getAssignments.mockResolvedValue([{ name: 'Homework', type: 'points', points: 10 }]);
    mocks.db.getAssignment.mockResolvedValue({ name: 'Homework', type: 'points', points: 10 });
    await expect(call()).resolves.toEqual(expected);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.single).not.toHaveBeenCalled();
    expect(mocks.db.pushAssignments).not.toHaveBeenCalled();
    expect(mocks.db.syncUpdate).not.toHaveBeenCalled();
  });

  it('does not add assignment sync after a prior authentication refresh when persistence fails', async () => {
    mocks.db.lastUpdated.mockResolvedValue(null);
    mocks.verify.mockResolvedValue(true);
    mocks.profile.mockResolvedValue({ id: 'user-1', first_name: 'Test', last_name: 'Student' });
    mocks.db.pushGeneralUserInfo.mockResolvedValue(undefined);
    const failure = new Error('Synthetic write failure');
    mocks.db.pushAssignments.mockRejectedValue(failure);

    await expect(call()).rejects.toBe(failure);
    expect(mocks.db.syncUpdate).toHaveBeenCalledExactlyOnceWith('user-1');
    expect(mocks.db.syncUpdate.mock.invocationCallOrder[0]).toBeLessThan(mocks.db.pushAssignments.mock.invocationCallOrder[0]);
  });
});
