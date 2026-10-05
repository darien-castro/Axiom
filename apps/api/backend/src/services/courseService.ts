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

export class CourseService {
  constructor() {}

  async createUserTable(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS User (
      userID BINARY(32) PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255)
    )`;
    await db.query(query);
  }

  async createCourseTable(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS Course (
      courseID VARCHAR(255) PRIMARY KEY,
      course_name VARCHAR(255) NOT NULL,
      course_term VARCHAR(255),
      course_section VARCHAR(50),
      courseDepartment VARCHAR(255)
    )`;
    await db.query(query);
  }

  async createUserCoursesTable(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS User_Courses (
      userID BINARY(32),
      courseID VARCHAR(255),
      grade VARCHAR(10),
      PRIMARY KEY (userID, courseID),
      FOREIGN KEY (userID) REFERENCES User(userID),
      FOREIGN KEY (courseID) REFERENCES Course(courseID)
    )`;
    await db.query(query);
  }

  async initAllTables(): Promise<void> {
    console.log('Initializing database schema...');
    try {
      await this.createUserTable();
      await this.createCourseTable();
      await this.createUserCoursesTable();
      console.log('All tables created successfully!');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async pushGeneralUserInfo(userInfoJSON: UserInfo): Promise<void> {
    try {
      const query = `INSERT IGNORE INTO User(userID, first_name, last_name)
                     VALUES (?,?,?)`;
      const values = [
        crypto.sha256(userInfoJSON.userID),
        userInfoJSON.firstName,
        userInfoJSON.lastName,
      ];
      await db.query(query, values);
    } catch (error) {
      console.error('Error Pushing Data into tables: ', error);
    }
  }

  async pushCourseInformation(courseInfoJSON: CourseInfo[]): Promise<void> {
    try {
      for (const course of courseInfoJSON) {
        const query = `INSERT IGNORE INTO Course(courseID, course_name, course_term, course_section, courseDepartment)
                       VALUES(?,?,?,?,?)`;
        const values = [
          course.courseID,
          course.courseName,
          course.courseTerm || null,
          course.courseSection || null,
          course.courseDepartment || null,
        ];

        console.log(values);
        await db.query(query, values);
      }
    } catch (error) {
      console.error('Error Pushing Data into Table: ', error);
    }
  }

  async pushGradeInformation(gradeInfoJSON: GradeInfo): Promise<void> {
    try {
      const query = `INSERT INTO User_Courses(userID, courseID, grade)
                     VALUES (?,?,?)
                     ON DUPLICATE KEY UPDATE grade = VALUES(grade)`;
      const values = [
        crypto.sha256(gradeInfoJSON.userID),
        gradeInfoJSON.courseID,
        gradeInfoJSON.grade,
      ];
      await db.query(query, values);
    } catch (error) {
      console.error('Error Pushing Grade Data into Table: ', error);
    }
  }

  async getUserInfo(userID: string): Promise<any> {
    const [rows] = await db.query('SELECT * FROM User WHERE userID = ?', [crypto.sha256(userID)]);
    return rows;
  }

  async getCourseInformation(courseID: string): Promise<any> {
    const [rows] = await db.query('SELECT * FROM Course WHERE courseID = ?', [courseID]);
    return rows;
  }

  async getGradeInformation(courseID: string): Promise<any> {
    const [rows] = await db.query('SELECT * FROM User_Courses WHERE courseID = ?', [courseID]);
    return rows;
  }
}
export default new CourseService();
