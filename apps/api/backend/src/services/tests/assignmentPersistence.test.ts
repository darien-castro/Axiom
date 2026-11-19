import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock('../db', () => ({ default: { assignment: { upsert: mocks.upsert } } }));
vi.mock('../../crypto/crypto', () => ({
  default: {},
  encryptValue: vi.fn(),
  decryptValue: vi.fn(),
}));

import db from '../databaseService';

describe('assignment persistence', () => {
  beforeEach(() => {
    mocks.upsert.mockReset().mockResolvedValue({});
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('preserves assignment mapping and resolves after all writes', async () => {
    await expect(db.pushAssignments('course-1', [
      { id: 1, name: 'Homework', grading_type: 'points', points_possible: '10' },
      { assignmentID: '2', assignmentName: 'Quiz', assignmentPoints: 20 },
    ])).resolves.toBeUndefined();

    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenNthCalledWith(1, {
      where: { assignmentId: '1' },
      update: { name: 'Homework', type: 'points', grade: null, points: 10, courseId: 'course-1' },
      create: { assignmentId: '1', name: 'Homework', type: 'points', grade: null, points: 10, courseId: 'course-1' },
    });
    expect(mocks.upsert).toHaveBeenNthCalledWith(2, {
      where: { assignmentId: '2' },
      update: { name: 'Quiz', type: null, grade: null, points: 20, courseId: 'course-1' },
      create: { assignmentId: '2', name: 'Quiz', type: null, grade: null, points: 20, courseId: 'course-1' },
    });
  });

  it.each([1, 2])('propagates failure on write %i and stops subsequent writes', async (failedWrite) => {
    const failure = new Error('Synthetic persistence failure');
    for (let write = 1; write < failedWrite; write++) mocks.upsert.mockResolvedValueOnce({});
    mocks.upsert.mockRejectedValueOnce(failure);

    await expect(db.pushAssignments('course-1', [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
      { id: '3', name: 'Third' },
    ])).rejects.toBe(failure);
    expect(mocks.upsert).toHaveBeenCalledTimes(failedWrite);
  });

  it('preserves empty-batch behavior', async () => {
    await expect(db.pushAssignments('course-1', [])).resolves.toBeUndefined();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
