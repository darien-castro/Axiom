import { test, expect } from 'vitest';
import db from '../../services/databaseService';
import prisma from '../../services/db';
import crypto from '../../crypto/crypto';

test('User Journey: login, input data, check db, and remove data', async () => {
  const userId = 'student_test_1';
  const apiKey = 'test_canvas_key_123';
  const sessionKey = 'test_session_abc';
  const courseId = 'TEST-101';
  const assignmentId = 'assign_1';
  const userKey = Uint8Array.from(crypto.hmacLookup(userId));

  // Initialize DB tables
  await db.initAllTables();

  // 1. Login & input user info
  await db.pushGeneralUserInfo(
    { userID: userId, firstName: 'Alex', lastName: 'Doe' },
    apiKey
  );
  await db.insertSessionKey(sessionKey, apiKey);

  const profile = await db.getUserInfo(userId);
  expect(profile.firstName).toBe('Alex');
  expect(await db.isSessionValid(sessionKey)).toBe(true);

  // 2. Input classes & assignments
  await db.pushCourseInformation([
    { courseID: courseId, courseName: 'Intro to CS' },
  ]);
  await db.pushUserCourses(userId, [courseId]);
  await db.pushAssignments(courseId, [
    { assignmentID: assignmentId, name: 'HW 1', points: 100 },
  ]);

  const courses = await db.getUserCourses(userId);
  expect(courses).toHaveLength(1);
  expect(courses[0].courseID).toBe(courseId);

  const assignments = await db.getAssignments(courseId);
  expect(assignments).toHaveLength(1);
  expect(assignments[0].name).toBe('HW 1');

  // 3. Check everything exists in database
  const dbUser = await prisma.user.findUnique({ where: { userId: userKey } });
  expect(dbUser).toBeDefined();

  const dbCourse = await prisma.course.findUnique({ where: { courseId } });
  expect(dbCourse).toBeDefined();

  // 4. Remove / cleanup data
  await db.deleteSessionKey(sessionKey);
  expect(await db.isSessionValid(sessionKey)).toBe(false);

  await prisma.assignment.deleteMany({ where: { assignmentId } });
  await prisma.userCourse.deleteMany({ where: { userId: userKey } });
  await prisma.course.deleteMany({ where: { courseId } });
  await prisma.userApiKey.deleteMany({ where: { userId: userKey } });
  await prisma.userInfo.deleteMany({ where: { userId: userKey } });
  await prisma.update.deleteMany({ where: { userId: userKey } });
  await prisma.user.deleteMany({ where: { userId: userKey } });

  // 5. Verify data was removed
  const deletedUser = await prisma.user.findUnique({
    where: { userId: userKey },
  });
  expect(deletedUser).toBeNull();

  const deletedCourse = await prisma.course.findUnique({
    where: { courseId },
  });
  expect(deletedCourse).toBeNull();
});

test('Error Handling: invalid inputs, missing records, and invalid sessions', async () => {
  // 1. Querying a non-existent user profile throws expected error
  await expect(db.getUserInfo('non_existent_user_9999')).rejects.toThrow(
    /not found in database/
  );

  // 2. Querying a non-existent user API key throws expected error
  await expect(db.getStoredApiKey('non_existent_user_9999')).rejects.toThrow(
    /API key for user .* not found in database/
  );

  // 3. Resolving an unknown/invalid API key returns null
  const unknownUser = await db.getUserIDByApiKey('invalid_unknown_api_key_0000');
  expect(unknownUser).toBeNull();

  // 4. Checking invalid/unregistered session returns false and null
  const isInvalidSession = await db.isSessionValid('invalid_session_key_random');
  expect(isInvalidSession).toBe(false);

  const invalidSessionKey = await db.getSessionApiKey('invalid_session_key_random');
  expect(invalidSessionKey).toBeNull();

  // 5. Querying non-existent assignment returns null
  const nonExistentAssignment = await db.getAssignment('missing_assignment_999');
  expect(nonExistentAssignment).toBeNull();

  // 6. Querying non-existent course returns empty array
  const nonExistentCourse = await db.getCourseInformation('MISSING-COURSE-999');
  expect(nonExistentCourse).toHaveLength(0);

  // 7. Querying last sync for non-existent user returns null
  const lastUpdate = await db.lastUpdated('non_existent_user_9999');
  expect(lastUpdate).toBeNull();
});
