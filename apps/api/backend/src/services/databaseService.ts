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
        course_section VARCHAR(50),
        courseDepartment VARCHAR(255)
      )`;
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
        courseID VARCHAR(255) REFERENCES Course(courseID)
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
        ON CONFLICT (userID) DO NOTHING`;
      const values = [
        crypto.sha256(userInfoJSON.userID),
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
          INSERT INTO Course (courseID, course_name, course_term, course_section, courseDepartment)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (courseID) DO NOTHING`;
        const values = [
          course.courseID,
          course.courseName,
          course.courseTerm || null,
          course.courseSection || null,
          course.courseDepartment || null,
        ];
        await db.query(query, values);
      }
    } catch (error) {
      console.error('Error pushing course data:', error);
    }
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

  async getUserInfo(userID: string): Promise<any[]> {
    const { rows } = await db.query('SELECT * FROM Users WHERE userID = $1', [
      crypto.sha256(userID),
    ]);
    return rows;
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
      const values = [crypto.sha256(userID), new Date()];
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
      [crypto.sha256(userID)]
    );
    const row = rows[0];
    if (!row || !row.updated_at) {
      return null;
    }
    return new Date(row.updated_at);
  }
}
export default new DatabaseService();
