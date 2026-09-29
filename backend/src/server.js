// server stuff
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

const student = require('./api-key.js')
const apiKey = student.returnAPIKey();
const API = require('./client/canvasclient.js');
const mapper = require('./mapper/mapper.js')
const courseService = require('./services/courseService.js')
const crypto = require('./crypto/crypto.js')


// cpp addon stuff
const addon = require('../build/Release/addon.node');



let classTest = new API("https://instructure.charlotte.edu", apiKey);

async function printEverything(){
  console.log("============= Courses ==================");
  const courses = await classTest.GetCourses();
  console.log(courses);

/*
  const testCourseCode = "265289";

  const courseAssignments = await classTest.GetCourseSubmissions(testCourseCode);
  console.log(courseAssignments);
*/
}

async function testService(){
  courseService.initAllTables();

  const courses = await classTest.GetCourses();
  const cleanCourses = mapper.cleanCourses(courses);
  courseService.pushCourseInformation(cleanCourses);

  const userInfo = await classTest.GetUserInformation();
  const cleanUserInfo = mapper.cleanUserInformation(userInfo);
  courseService.pushGeneralUserInfo(cleanUserInfo);
}

printEverything(); 

