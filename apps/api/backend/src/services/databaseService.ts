import db from './db';
import crypto from '../crypto/crypto';

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

interface UpdateRow {
  updated_at: Date | string;
}



export class DatabaseService {
  constructor() {}

  async createUserTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS Users (
        userID BYTEA PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255)
      )`;
    await db.query(query);
  }

  async createCourseTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS Course (
        courseID VARCHAR(255) PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        course_term VARCHAR(255),
        course_term_id VARCHAR(50),
        course_code VARCHAR(50),
        course_section VARCHAR(50),
        courseDepartment VARCHAR(255)
      );
      ALTER TABLE Course ADD COLUMN IF NOT EXISTS course_term_id VARCHAR(50);
      ALTER TABLE Course ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
    `;
    await db.query(query);
  }

  async createUserCoursesTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS User_Courses (
        userID BYTEA REFERENCES Users(userID),
        courseID VARCHAR(255) REFERENCES Course(courseID),
        grade VARCHAR(10),
        PRIMARY KEY (userID, courseID)
      )`;
    await db.query(query);
  }

  async createAssignmentTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS Assignment (
        assignmentID VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255),
        grade VARCHAR(10),
        points FLOAT,
        courseID VARCHAR(255) REFERENCES Course(courseID)
      );
      ALTER TABLE Assignment ADD COLUMN IF NOT EXISTS points FLOAT;
    `;
    await db.query(query);
  }

  async createSubmissionTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS Submission (
        submissionID VARCHAR(255) PRIMARY KEY,
        assignmentID VARCHAR(255),
        courseID VARCHAR(255),
        userID BYTEA,
        score FLOAT,
        grade VARCHAR(50),
        submitted_at VARCHAR(255)
      )`;
    await db.query(query);
  }

  async createUpdateTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS Updates (
        updateID SERIAL PRIMARY KEY,
        userID BYTEA REFERENCES Users(userID),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    await db.query(query);
  }

  async initAllTables(): Promise<void> {
    console.log('Initializing PostgreSQL schema...');
    try {
      await this.createUserTable();
      await this.createCourseTable();
      await this.createUserCoursesTable();
      await this.createAssignmentTable();
      await this.createSubmissionTable();
      await this.createUpdateTable();
      console.log('All tables created successfully!');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async pushGeneralUserInfo(userInfoJSON: UserInfo): Promise<void> {
    try {
      const query = `
        INSERT INTO Users (userID, first_name, last_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (userID) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name`;
      const values = [
        userInfoJSON.userID,
        userInfoJSON.firstName,
        userInfoJSON.lastName,
      ];
      await db.query(query, values);
    } catch (error) {
      console.error('Error pushing user data:', error);
    }
  }

  async pushCourseInformation(courseInfoJSON: CourseInfo[]): Promise<void> {
    try {
      for (const course of courseInfoJSON) {
        const query = `
          INSERT INTO Course (courseID, course_name, course_term, course_term_id, course_code, course_section, courseDepartment)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (courseID) DO UPDATE SET
            course_name = EXCLUDED.course_name,
            course_term = EXCLUDED.course_term,
            course_term_id = EXCLUDED.course_term_id,
            course_code = EXCLUDED.course_code,
            course_section = EXCLUDED.course_section,
            courseDepartment = EXCLUDED.courseDepartment`;
        const values = [
          course.courseID,
          course.courseName,
          course.courseTerm || null,
          course.courseTermId || null,
          course.courseCode || null,
          course.courseSection || null,
          course.courseDepartment || null,
        ];
        await db.query(query, values);
      }
    } catch (error) {
      console.error('Error pushing course data:', error);
    }
  }

  async pushUserCourses(userID: string, courseIDs: string[]): Promise<void> {
    try {
      for (const courseID of courseIDs) {
        const query = `
          INSERT INTO User_Courses (userID, courseID)
          VALUES ($1, $2)
          ON CONFLICT (userID, courseID) DO NOTHING`;
        await db.query(query, [userID, courseID]);
      }
    } catch (error) {
      console.error('Error pushing user courses:', error);
    }
  }

  async getUserCourses(userID: string): Promise<any[]> {
    const query = `
      SELECT c.courseID, c.course_name as "courseName", c.course_term as "courseTerm",
             c.course_term_id as "courseTermId", c.course_code as "courseCode",
             c.course_section as "courseSection", c.courseDepartment
      FROM Course c
      JOIN User_Courses uc ON c.courseID = uc.courseID
      WHERE uc.userID = $1`;
    const { rows } = await db.query(query, [userID]);
    return rows;
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

        const query = `
          INSERT INTO Assignment (assignmentID, name, type, grade, points, courseID)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (assignmentID) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            grade = EXCLUDED.grade,
            points = EXCLUDED.points,
            courseID = EXCLUDED.courseID`;
        await db.query(query, [String(id), name, type, grade, points, String(courseID)]);
      }
    } catch (error) {
      console.error('Error pushing assignments:', error);
    }
  }

  async getAssignments(courseID: string): Promise<any[]> {
    const { rows } = await db.query('SELECT * FROM Assignment WHERE courseID = $1', [
      String(courseID),
    ]);
    return rows;
  }

  async getAssignment(assignmentID: string): Promise<any | null> {
    const { rows } = await db.query('SELECT * FROM Assignment WHERE assignmentID = $1', [
      String(assignmentID),
    ]);
    return rows[0] || null;
  }

  async pushSubmissions(courseID: string, userID: string, submissions: any[]): Promise<void> {
    try {
      for (const s of submissions) {
        const id = s.id ? String(s.id) : `${courseID}_${s.assignment_id || s.assignmentID}_${userID}`;
        const query = `
          INSERT INTO Submission (submissionID, assignmentID, courseID, userID, score, grade, submitted_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (submissionID) DO UPDATE SET
            score = EXCLUDED.score,
            grade = EXCLUDED.grade,
            submitted_at = EXCLUDED.submitted_at`;
        await db.query(query, [
          id,
          String(s.assignment_id || s.assignmentID || ''),
          String(courseID),
          userID,
          s.score !== null && s.score !== undefined ? Number(s.score) : null,
          s.grade ? String(s.grade) : null,
          s.submitted_at ? String(s.submitted_at) : null,
        ]);
      }
    } catch (error) {
      console.error('Error pushing submissions:', error);
    }
  }

  async getSubmissions(courseID: string, userID?: string): Promise<any[]> {
    let query = 'SELECT * FROM Submission WHERE courseID = $1';
    const values: any[] = [String(courseID)];
    if (userID) {
      query += ' AND userID = $2';
      values.push(userID);
    }
    const { rows } = await db.query(query, values);
    return rows;
  }

  async pushGradeInformation(gradeInfoJSON: GradeInfo): Promise<void> {
    try {
      const query = `
        INSERT INTO User_Courses (userID, courseID, grade)
        VALUES ($1, $2, $3)
        ON CONFLICT (userID, courseID)
        DO UPDATE SET grade = EXCLUDED.grade`;
      const values = [
        crypto.sha256(gradeInfoJSON.userID),
        gradeInfoJSON.courseID,
        gradeInfoJSON.grade,
      ];
      await db.query(query, values);
      await this.syncUpdate(gradeInfoJSON.userID);
    } catch (error) {
      console.error('Error pushing grade data:', error);
    }
  }

  async getUserInfo(userID: string): Promise<UserInfo> {
    const { rows } = await db.query('SELECT * FROM Users WHERE userID = $1', [
      userID,
    ]);
    const user = rows[0];
    if (!user) {
      throw new Error(`User with ID ${userID} not found in database`);
    }
    const retUserInfo: UserInfo = {
      userID: user.userID?.toString() ?? userID,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    return retUserInfo;
  }

  async getCourseInformation(courseID: string): Promise<any[]> {
    const { rows } = await db.query('SELECT * FROM Course WHERE courseID = $1', [
      courseID,
    ]);
    return rows;
  }

  async getGradeInformation(courseID: string): Promise<any[]> {
    const { rows } = await db.query(
      'SELECT * FROM User_Courses WHERE courseID = $1',
      [courseID]
    );
    return rows;
  }

  async syncUpdate(userID: string): Promise<void> {
    try {
      const query = `
        INSERT INTO Updates (userID, updated_at)
        VALUES ($1, $2)`;
      const values = [userID, new Date()];
      await db.query(query, values);
    } catch (error) {
      console.error(`Error Syncing Database: ${error}`);
    }
  }

  async lastUpdated(userID: string): Promise<Date | null> {
    const { rows } = await db.query<UpdateRow>(
      `SELECT updated_at
       FROM Updates
       WHERE userID = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userID]
    );
    const row = rows[0];
    if (!row || !row.updated_at) {
      return null;
    }
    return new Date(row.updated_at);
  }
}
export default new DatabaseService();
