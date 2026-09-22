const mysql = require('mysql')
const map = require('../mapper/mapper.js')
const apiservice = require('../client/canvasclient.js')
const db = require('./db.js')
const crypto = require('../crypto/crypto.js')

class courseService{
  // this class will be the one cleaning the variables
  constructor(){
  };

async createUserTable() {
    const query = `CREATE TABLE IF NOT EXISTS User (
      userID BINARY(32) PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255)
    )`;
    await db.query(query);
  }

  async createCourseTable() {
    const query = `CREATE TABLE IF NOT EXISTS Course (
      courseID INT PRIMARY KEY,
      course_name VARCHAR(255) NOT NULL
    )`;
    await db.query(query);
  }

  async createUserCoursesTable() {
    const query = `CREATE TABLE IF NOT EXISTS User_Courses (
      userID BINARY(32),
      courseID INT,
      grade VARCHAR(10),
      PRIMARY KEY (userID, courseID),
      FOREIGN KEY (userID) REFERENCES User(userID),
      FOREIGN KEY (courseID) REFERENCES Course(courseID)
    )`;
    await db.query(query);
  } 

  async initAllTables() {
    console.log("Initializing database schema...");
    try {
      // 1. Create independent tables first
      await this.createUserTable();
      await this.createCourseTable();
      
      // 2. Create dependent tables last
      await this.createUserCoursesTable();
      
      console.log("All tables created successfully!");
    } catch (error) {
      console.error("Error creating tables:", error);
    }
  }

  async pushGeneralUserInfo(userInfoJSON){
    try{
      const query = `INSERT IGNORE INTO User(UserID, first_name, last_name)
                    VALUES (?,?,?)`;
      const values = [
        crypto.sha256(userInfoJSON.userID),
        userInfoJSON.firstName,
        userInfoJSON.lastName

      ]
      await db.query(query, values);
    }
    catch(error){
      console.error("Error Pushing Data into tables: ", error); 
    }
  };

  pushCourseInformation(courseInfoJSON){
    
  };
  
  pushGradeInformation(gradeInfoJSON){
    
  };

  getUserInfo(){};
  getCourseInformation(courseID){};
  getGradeInformation(courseID){};
}

module.exports = new courseService()
