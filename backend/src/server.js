
// server stuff
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

// local js files
const student = require('./api-key.js')
const apiKey = student.returnAPIKey();
const API = require('./client/canvasclient.js');
const mapper = require('./mapper/mapper.js')
const courseService = require('./services/courseService.js')

// cpp addon stuff
const addon = require('../build/Release/addon.node');




let classTest = new API("https://instructure.charlotte.edu", apiKey);

async function printEverything(){
  console.log("============= Courses ==================");
  const courses = await classTest.GetCourses();
  const cleanCourses = mapper.cleanCourses(courses);
  console.log(cleanCourses);

  console.log("\n\n\n");

  console.log("============= Course Grades ================");
  const courseGrades = await classTest.GetCourseGrades();
  const cleanCourseGrades = mapper.cleanCourseGrades(courseGrades);
  console.log(cleanCourseGrades); 
  console.log("\n\n\n");


  console.log("============= user information ================");
  const userInfo = await classTest.GetUserInformation();
  const cleanUserInfo = mapper.cleanUserInformation(userInfo);
  console.log(cleanUserInfo); 

}

async function test(){
  const userInfo = await classTest.GetUserInformation();
  const cleanUserInfo = mapper.cleanUserInformation(userInfo);
  courseService.initAllTables();
  courseService.pushGeneralUserInfo(cleanUserInfo);
  console.log("Done!")
}

test();
printEverything(); 

