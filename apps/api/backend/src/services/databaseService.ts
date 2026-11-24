import prisma from './db';
import type { Prisma } from '@prisma/client';
import crypto, { decryptValue, encryptValue } from '../crypto/crypto';

export interface UserInfo {
  userID: string;
  firstName: string;
  lastName: string;
}

export interface CourseInfo {
  courseID: string;
  courseName: string;
  courseTerm?: string;
  courseTermId?: string;
  courseCode?: string;
  courseSection?: string;
  courseDepartment?: string;
}

export interface GradeInfo {
  userID: string;
  courseID: string;
  grade: string;
}

export interface GpaTranscriptTotals {
  semesterKey: string;
  gpaHours: number;
  qualityPoints: number;
}

export interface AssignmentTimeEstimate {
  assignmentId: string;
  estimatedMinutes: number;
  reportCount: number;
}

export interface DismissedAssignment {
  courseId: string;
  assignmentId: string;
  courseName: string;
  assignmentName: string;
}

function userKey(userID: string): Uint8Array<ArrayBuffer> {
  const buf = crypto.hmacLookup(userID);
  const ab = new ArrayBuffer(buf.byteLength);
  const u8 = new Uint8Array(ab);
  u8.set(buf);
  return u8;
}

function encryptedNullable(value: string | number | null | undefined): string | null {
  return value === null || value === undefined ? null : encryptValue(String(value));
}

function decryptedNullable(value: string | null): string | null {
  if (value === null || value === undefined) return null;
  try {
    return decryptValue(value);
  } catch {
    return null;
  }
}

export class DatabaseService {
  constructor() {}

  async createUserTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Users (
        userID BYTEA PRIMARY KEY
      )`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Users ALTER COLUMN first_name DROP NOT NULL
    `);
  }

  async createUserApiKeyTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS User_Api_Keys (
        userID BYTEA PRIMARY KEY REFERENCES Users(userID) ON DELETE CASCADE,
        encrypted_user_id TEXT,
        encrypted_api_key TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE User_Api_Keys ADD COLUMN IF NOT EXISTS encrypted_user_id TEXT
    `);
  }

  async createUserInfoTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS User_Info (
        userID BYTEA PRIMARY KEY REFERENCES Users(userID) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
  }

  async createCourseTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Course (
        courseID VARCHAR(255) PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        course_term VARCHAR(255),
        course_term_id VARCHAR(50),
        course_code VARCHAR(50),
        course_section VARCHAR(50),
        courseDepartment VARCHAR(255)
      )`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Course ADD COLUMN IF NOT EXISTS course_term_id VARCHAR(50)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Course ADD COLUMN IF NOT EXISTS course_code VARCHAR(50)`);
  }

  async createUserCoursesTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS User_Courses (
        userID BYTEA REFERENCES Users(userID),
        courseID VARCHAR(255) REFERENCES Course(courseID),
        grade TEXT,
        PRIMARY KEY (userID, courseID)
      )`);
    await prisma.$executeRawUnsafe('ALTER TABLE User_Courses ALTER COLUMN grade TYPE TEXT');
  }

  async createAssignmentTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Assignment (
        assignmentID VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255),
        grade TEXT,
        points FLOAT,
        courseID VARCHAR(255) REFERENCES Course(courseID)
      )`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Assignment ADD COLUMN IF NOT EXISTS points FLOAT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Assignment ALTER COLUMN grade TYPE TEXT`);
  }

  async createSubmissionTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Submission (
        submissionID VARCHAR(255) PRIMARY KEY,
        assignmentID VARCHAR(255),
        courseID VARCHAR(255),
        userID BYTEA,
        score TEXT,
        grade TEXT,
        submitted_at TEXT
      )`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Submission ALTER COLUMN score TYPE TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Submission ALTER COLUMN grade TYPE TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Submission ALTER COLUMN submitted_at TYPE TEXT`);
  }

  async createUpdateTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Updates (
        updateID SERIAL PRIMARY KEY,
        userID BYTEA REFERENCES Users(userID),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
  }

  async createSessionTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Sessions (
        session_key VARCHAR(255) PRIMARY KEY,
        api_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
  }

  async createWorkloadTables(): Promise<void> {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS course_credit_hours (
        student_key BYTEA NOT NULL,
        course_id TEXT NOT NULL,
        credit_hours DOUBLE PRECISION NOT NULL CHECK (credit_hours >= 0),
        PRIMARY KEY (student_key, course_id)
      )`;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS gpa_transcript_totals (
        student_key BYTEA PRIMARY KEY,
        semester_key TEXT NOT NULL,
        gpa_hours DOUBLE PRECISION NOT NULL CHECK (gpa_hours >= 0),
        quality_points DOUBLE PRECISION NOT NULL CHECK (quality_points >= 0 AND quality_points <= gpa_hours * 4)
      )`;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS hidden_courses (
        student_key BYTEA NOT NULL,
        course_id TEXT NOT NULL,
        PRIMARY KEY (student_key, course_id)
      )`;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS dismissed_assignments (
        student_key BYTEA NOT NULL,
        course_id TEXT NOT NULL,
        assignment_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        assignment_name TEXT NOT NULL,
        dismissed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (student_key, course_id, assignment_id)
      )`;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS focused_assignments (
        student_key BYTEA NOT NULL,
        course_id TEXT NOT NULL,
        assignment_id TEXT NOT NULL,
        PRIMARY KEY (student_key, course_id, assignment_id)
      )`;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS assignment_time_reports (
        course_id TEXT NOT NULL,
        assignment_id TEXT NOT NULL,
        student_key BYTEA NOT NULL,
        minutes INTEGER NOT NULL CHECK (minutes > 0),
        PRIMARY KEY (course_id, assignment_id, student_key)
      )`;
  }

  async getCourseCreditHours(userID: string) {
    return prisma.$queryRaw<{ courseId: string; creditHours: number }[]>`
      SELECT course_id AS "courseId", credit_hours AS "creditHours"
      FROM course_credit_hours WHERE student_key = ${userKey(userID)}`;
  }

  async saveCourseCreditHours(userID: string, courseID: string, creditHours: number, client: Prisma.TransactionClient = prisma) {
    await client.$executeRaw`
      INSERT INTO course_credit_hours (student_key, course_id, credit_hours)
      VALUES (${userKey(userID)}, ${courseID}, ${creditHours})
      ON CONFLICT (student_key, course_id) DO UPDATE SET credit_hours = EXCLUDED.credit_hours`;
  }

  async getGpaTranscriptTotals(userID: string) {
    const [transcript] = await prisma.$queryRaw<GpaTranscriptTotals[]>`
      SELECT semester_key AS "semesterKey", gpa_hours AS "gpaHours", quality_points AS "qualityPoints"
      FROM gpa_transcript_totals WHERE student_key = ${userKey(userID)}`;
    return transcript ?? null;
  }

  async saveGpaSetup(userID: string, credits: { courseId: string; creditHours: number }[], transcript?: GpaTranscriptTotals) {
    await prisma.$transaction(async (transaction) => {
      for (const { courseId, creditHours } of credits) {
        await this.saveCourseCreditHours(userID, courseId, creditHours, transaction);
      }
      if (transcript) {
        await transaction.$executeRaw`
          INSERT INTO gpa_transcript_totals (student_key, semester_key, gpa_hours, quality_points)
          VALUES (${userKey(userID)}, ${transcript.semesterKey}, ${transcript.gpaHours}, ${transcript.qualityPoints})
          ON CONFLICT (student_key) DO UPDATE SET semester_key = EXCLUDED.semester_key,
            gpa_hours = EXCLUDED.gpa_hours, quality_points = EXCLUDED.quality_points`;
      }
    });
  }

  async getHiddenCourses(userID: string) {
    return prisma.$queryRaw<{ courseId: string }[]>`
      SELECT course_id AS "courseId" FROM hidden_courses WHERE student_key = ${userKey(userID)}`;
  }

  async saveCourseVisibility(userID: string, courseID: string, hidden: boolean) {
    const studentKey = userKey(userID);
    if (hidden) {
      await prisma.$executeRaw`
        INSERT INTO hidden_courses (student_key, course_id) VALUES (${studentKey}, ${courseID})
        ON CONFLICT (student_key, course_id) DO NOTHING`;
    } else {
      await prisma.$executeRaw`DELETE FROM hidden_courses WHERE student_key = ${studentKey} AND course_id = ${courseID}`;
    }
  }

  async getAssignmentTimeEstimates(courseID: string) {
    return prisma.$queryRaw<AssignmentTimeEstimate[]>`
      SELECT assignment_id AS "assignmentId",
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY minutes) AS "estimatedMinutes",
        COUNT(*)::int AS "reportCount"
      FROM assignment_time_reports WHERE course_id = ${courseID}
      GROUP BY assignment_id`;
  }

  async getDismissedAssignments(userID: string) {
    return prisma.$queryRaw<DismissedAssignment[]>`
      SELECT course_id AS "courseId", assignment_id AS "assignmentId",
        course_name AS "courseName", assignment_name AS "assignmentName"
      FROM dismissed_assignments WHERE student_key = ${userKey(userID)}
      ORDER BY dismissed_at DESC, course_id, assignment_id`;
  }

  async dismissAssignment(userID: string, assignment: DismissedAssignment) {
    const { courseId, assignmentId, courseName, assignmentName } = assignment;
    await prisma.$executeRaw`
      INSERT INTO dismissed_assignments (student_key, course_id, assignment_id, course_name, assignment_name)
      VALUES (${userKey(userID)}, ${courseId}, ${assignmentId}, ${courseName}, ${assignmentName})
      ON CONFLICT (student_key, course_id, assignment_id) DO UPDATE
      SET course_name = EXCLUDED.course_name, assignment_name = EXCLUDED.assignment_name`;
  }

  async restoreAssignment(userID: string, courseId: string, assignmentId: string) {
    await prisma.$executeRaw`
      DELETE FROM dismissed_assignments
      WHERE student_key = ${userKey(userID)} AND course_id = ${courseId} AND assignment_id = ${assignmentId}`;
  }

  async getFocusedAssignments(userID: string) {
    return prisma.$queryRaw<{ courseId: string; assignmentId: string }[]>`
      SELECT course_id AS "courseId", assignment_id AS "assignmentId"
      FROM focused_assignments WHERE student_key = ${userKey(userID)}`;
  }

  async saveAssignmentFocus(userID: string, courseId: string, assignmentId: string, focused: boolean) {
    const studentKey = userKey(userID);
    if (focused) {
      await prisma.$executeRaw`
        INSERT INTO focused_assignments (student_key, course_id, assignment_id)
        VALUES (${studentKey}, ${courseId}, ${assignmentId})
        ON CONFLICT (student_key, course_id, assignment_id) DO NOTHING`;
    } else {
      await prisma.$executeRaw`
        DELETE FROM focused_assignments
        WHERE student_key = ${studentKey} AND course_id = ${courseId} AND assignment_id = ${assignmentId}`;
    }
  }

  async saveAssignmentTimeReport(userID: string, courseID: string, assignmentID: string, minutes: number) {
    await prisma.$executeRaw`
      INSERT INTO assignment_time_reports (course_id, assignment_id, student_key, minutes)
      VALUES (${courseID}, ${assignmentID}, ${userKey(userID)}, ${minutes}::integer)
      ON CONFLICT (course_id, assignment_id, student_key) DO UPDATE SET minutes = EXCLUDED.minutes`;
  }

  async getStudentTimeReports(userID: string) {
    return prisma.$queryRaw<{ courseId: string; assignmentId: string; minutes: number }[]>`
      SELECT course_id AS "courseId", assignment_id AS "assignmentId", minutes
      FROM assignment_time_reports WHERE student_key = ${userKey(userID)}`;
  }

  async removeAssignmentTimeReport(userID: string, courseId: string, assignmentId: string) {
    await prisma.$executeRaw`
      DELETE FROM assignment_time_reports
      WHERE student_key = ${userKey(userID)} AND course_id = ${courseId} AND assignment_id = ${assignmentId}`;
  }

  async initAllTables(): Promise<void> {
    console.log('Connecting to database via Prisma and initializing schema...');
    try {
      await prisma.$connect();
      await this.createUserTable();
      await this.createUserApiKeyTable();
      await this.createUserInfoTable();
      await this.createCourseTable();
      await this.createUserCoursesTable();
      await this.createAssignmentTable();
      await this.createSubmissionTable();
      await this.createUpdateTable();
      await this.createSessionTable();
      await this.createWorkloadTables();
      console.log('All tables verified and initialized successfully!');
    } catch (error) {
      console.error('Error initializing tables via Prisma:', error);
    }
  }

  async pushGeneralUserInfo(userInfoJSON: UserInfo, apiKey?: string): Promise<void> {
    try {
      const key = userKey(userInfoJSON.userID);
      await prisma.user.upsert({
        where: { userId: key },
        update: {
          firstName: userInfoJSON.firstName || '',
          lastName: userInfoJSON.lastName || null,
        },
        create: {
          userId: key,
          firstName: userInfoJSON.firstName || '',
          lastName: userInfoJSON.lastName || null,
        },
      });
      await this.pushUserApiKey(userInfoJSON.userID, apiKey || userInfoJSON.userID);
      await this.pushUserInfo(userInfoJSON);
    } catch (error) {
      console.error('Error pushing user data:', error);
      throw error;
    }
  }

  async pushUserApiKey(userID: string, apiKey: string): Promise<void> {
    const key = userKey(userID);
    await prisma.userApiKey.upsert({
      where: { userId: key },
      update: {
        encryptedUserId: encryptValue(userID),
        encryptedApiKey: encryptValue(apiKey),
        updatedAt: new Date(),
      },
      create: {
        userId: key,
        encryptedUserId: encryptValue(userID),
        encryptedApiKey: encryptValue(apiKey),
        updatedAt: new Date(),
      },
    });
  }

  async pushUserInfo(userInfo: UserInfo): Promise<void> {
    const key = userKey(userInfo.userID);
    await prisma.userInfo.upsert({
      where: { userId: key },
      update: {
        firstName: encryptValue(userInfo.firstName),
        lastName: encryptValue(userInfo.lastName),
        updatedAt: new Date(),
      },
      create: {
        userId: key,
        firstName: encryptValue(userInfo.firstName),
        lastName: encryptValue(userInfo.lastName),
        updatedAt: new Date(),
      },
    });
  }

  async pushCourseInformation(courseInfoJSON: CourseInfo[]): Promise<void> {
    try {
      for (const course of courseInfoJSON) {
        await prisma.course.upsert({
          where: { courseId: course.courseID },
          update: {
            courseName: course.courseName,
            courseTerm: course.courseTerm || null,
            courseTermId: course.courseTermId || null,
            courseCode: course.courseCode || null,
            courseSection: course.courseSection || null,
            courseDepartment: course.courseDepartment || null,
          },
          create: {
            courseId: course.courseID,
            courseName: course.courseName,
            courseTerm: course.courseTerm || null,
            courseTermId: course.courseTermId || null,
            courseCode: course.courseCode || null,
            courseSection: course.courseSection || null,
            courseDepartment: course.courseDepartment || null,
          },
        });
      }
    } catch (error) {
      console.error('Error pushing course data:', error);
    }
  }

  async pushUserCourses(userID: string, courseIDs: string[]): Promise<void> {
    try {
      const key = userKey(userID);
      for (const courseID of courseIDs) {
        await prisma.userCourse.upsert({
          where: {
            userId_courseId: {
              userId: key,
              courseId: courseID,
            },
          },
          update: {},
          create: {
            userId: key,
            courseId: courseID,
          },
        });
      }
    } catch (error) {
      console.error('Error pushing user courses:', error);
    }
  }

  async getUserCourses(userID: string): Promise<any[]> {
    const key = userKey(userID);
    const userCourses = await prisma.userCourse.findMany({
      where: { userId: key },
      include: {
        course: true,
      },
    });
    return userCourses.map((uc) => ({
      courseID: uc.course.courseId,
      courseName: uc.course.courseName,
      courseTerm: uc.course.courseTerm,
      courseTermId: uc.course.courseTermId,
      courseCode: uc.course.courseCode,
      courseSection: uc.course.courseSection,
      courseDepartment: uc.course.courseDepartment,
    }));
  }

  async pushAssignments(courseID: string, assignments: any[]): Promise<void> {
    try {
      for (const a of assignments) {
        const id = a.id ?? a.assignmentID ?? a.assignmentId;
        if (!id) continue;
        const name = a.name ?? a.assignmentName ?? '';
        const type = a.grading_type ?? a.type ?? a.assignmentType ?? null;
        const points = a.points_possible ?? a.assignmentPoints ?? a.points ?? null;
        const grade = a.grade ?? null;

        await prisma.assignment.upsert({
          where: { assignmentId: String(id) },
          update: {
            name,
            type,
            grade,
            points: points !== null && points !== undefined ? Number(points) : null,
            courseId: String(courseID),
          },
          create: {
            assignmentId: String(id),
            name,
            type,
            grade,
            points: points !== null && points !== undefined ? Number(points) : null,
            courseId: String(courseID),
          },
        });
      }
    } catch (error) {
      console.error('Error pushing assignments:', error);
    }
  }

  async getAssignments(courseID: string): Promise<any[]> {
    const assignments = await prisma.assignment.findMany({
      where: { courseId: String(courseID) },
    });
    return assignments.map((row) => ({
      assignmentID: row.assignmentId,
      name: row.name,
      type: row.type,
      grade: row.grade,
      points: row.points,
      courseID: row.courseId,
    }));
  }

  async getAssignment(assignmentID: string): Promise<any | null> {
    const assignment = await prisma.assignment.findUnique({
      where: { assignmentId: String(assignmentID) },
    });
    if (!assignment) return null;
    return {
      assignmentID: assignment.assignmentId,
      name: assignment.name,
      type: assignment.type,
      grade: assignment.grade,
      points: assignment.points,
      courseID: assignment.courseId,
    };
  }

  async pushSubmissions(courseID: string, userID: string, submissions: any[]): Promise<void> {
    try {
      const key = userKey(userID);
      for (const s of submissions) {
        const id = s.id
          ? String(s.id)
          : `${courseID}_${s.assignment_id || s.assignmentID}_${Buffer.from(key).toString('hex')}`;
        await prisma.submission.upsert({
          where: { submissionId: id },
          update: {
            score: encryptedNullable(s.score !== null && s.score !== undefined ? Number(s.score) : null),
            grade: encryptedNullable(s.grade ? String(s.grade) : null),
            submittedAt: encryptedNullable(s.submitted_at ? String(s.submitted_at) : null),
          },
          create: {
            submissionId: id,
            assignmentId: String(s.assignment_id || s.assignmentID || ''),
            courseId: String(courseID),
            userId: key,
            score: encryptedNullable(s.score !== null && s.score !== undefined ? Number(s.score) : null),
            grade: encryptedNullable(s.grade ? String(s.grade) : null),
            submittedAt: encryptedNullable(s.submitted_at ? String(s.submitted_at) : null),
          },
        });
      }
    } catch (error) {
      console.error('Error pushing submissions:', error);
    }
  }

  async getSubmissions(courseID: string, userID?: string): Promise<any[]> {
    const submissions = await prisma.submission.findMany({
      where: {
        courseId: String(courseID),
        ...(userID ? { userId: userKey(userID) } : {}),
      },
    });
    return submissions.map((row) => ({
      submissionID: row.submissionId,
      assignmentID: row.assignmentId,
      courseID: row.courseId,
      userID: row.userId,
      score: decryptedNullable(row.score),
      grade: decryptedNullable(row.grade),
      submitted_at: decryptedNullable(row.submittedAt),
    }));
  }

  async pushGradeInformation(gradeInfoJSON: GradeInfo): Promise<void> {
    try {
      const key = userKey(gradeInfoJSON.userID);
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId: key,
            courseId: gradeInfoJSON.courseID,
          },
        },
        update: {
          grade: gradeInfoJSON.grade,
        },
        create: {
          userId: key,
          courseId: gradeInfoJSON.courseID,
          grade: gradeInfoJSON.grade,
        },
      });
      await this.syncUpdate(gradeInfoJSON.userID);
    } catch (error) {
      console.error('Error pushing grade data:', error);
    }
  }

  async getUserInfo(userID: string): Promise<UserInfo> {
    const key = userKey(userID);
    const user = await prisma.userInfo.findUnique({
      where: { userId: key },
    });
    if (!user) {
      throw new Error(`User with ID ${userID} not found in database`);
    }

    const retUserInfo: UserInfo = {
      userID,
      firstName: decryptValue(user.firstName),
      lastName: user.lastName ? decryptValue(user.lastName) : '',
    };
    return retUserInfo;
  }

  async getUserIDByApiKey(apiKey: string): Promise<string | null> {
    const rows = await prisma.userApiKey.findMany({
      select: {
        encryptedUserId: true,
        encryptedApiKey: true,
      },
    });
    const matchingRow = rows.find((row) => {
      if (!row.encryptedUserId || !row.encryptedApiKey) return false;
      try {
        return decryptValue(row.encryptedApiKey) === apiKey;
      } catch {
        return false;
      }
    });
    if (!matchingRow || !matchingRow.encryptedUserId) {
      return null;
    }
    try {
      return decryptValue(matchingRow.encryptedUserId);
    } catch {
      return null;
    }
  }

  async getStoredApiKey(userID: string): Promise<string> {
    const key = userKey(userID);
    const row = await prisma.userApiKey.findUnique({
      where: { userId: key },
      select: { encryptedApiKey: true },
    });
    const apiKey = row?.encryptedApiKey;
    if (!apiKey) {
      throw new Error(`API key for user ${userID} not found in database`);
    }
    return decryptValue(apiKey);
  }

  async getCourseInformation(courseID: string): Promise<any[]> {
    const rows = await prisma.course.findMany({
      where: { courseId: courseID },
    });
    return rows.map((r) => ({
      courseID: r.courseId,
      course_name: r.courseName,
      course_term: r.courseTerm,
      course_term_id: r.courseTermId,
      course_code: r.courseCode,
      course_section: r.courseSection,
      courseDepartment: r.courseDepartment,
    }));
  }

  async getGradeInformation(courseID: string): Promise<any[]> {
    const rows = await prisma.userCourse.findMany({
      where: { courseId: courseID },
    });
    return rows.map((row) => ({
      userID: row.userId,
      courseID: row.courseId,
      grade: row.grade,
    }));
  }

  async getUserGradeInformation(userID: string): Promise<GradeInfo[]> {
    const key = userKey(userID);
    const rows = await prisma.userCourse.findMany({
      where: { userId: key },
    });
    return rows.map((row) => ({
      userID: userID,
      courseID: row.courseId,
      grade: row.grade ?? '',
    }));
  }

  async syncUpdate(userID: string): Promise<void> {
    try {
      const key = userKey(userID);
      await prisma.update.create({
        data: {
          userId: key,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error Syncing Database: ${error}`);
    }
  }

  async lastUpdated(userID: string): Promise<Date | null> {
    const key = userKey(userID);
    const row = await prisma.update.findFirst({
      where: { userId: key },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    if (!row || !row.updatedAt) {
      return null;
    }
    return new Date(row.updatedAt);
  }

  async insertSessionKey(sessionKey: string, apiKey: string): Promise<void> {
    try {
      await prisma.session.upsert({
        where: { sessionKey },
        update: {
          apiKey,
          createdAt: new Date(),
        },
        create: {
          sessionKey,
          apiKey,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error inserting session key:', error);
      throw error;
    }
  }

  async getSessionApiKey(sessionKey: string): Promise<string | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionKey },
        select: { apiKey: true },
      });
      if (!session || !session.apiKey) {
        return null;
      }
      return session.apiKey;
    } catch (error) {
      console.error('Error retrieving session key:', error);
      return null;
    }
  }

  async isSessionValid(sessionKey: string): Promise<boolean> {
    const apiKey = await this.getSessionApiKey(sessionKey);
    return apiKey !== null;
  }

  async deleteSessionKey(sessionKey: string): Promise<void> {
    await prisma.session.deleteMany({ where: { sessionKey } });
  }
}

export default new DatabaseService();
