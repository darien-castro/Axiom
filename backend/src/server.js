const API = require('./client/canvasclient.js');
const mapper = require('./mapper/mapper.js')
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

const addon = require('../build/Release/addon.node');


app.use(cors());
app.use(express.json());


let classTest = new API("https://instructure.charlotte.edu", "");

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
}

async function test(){
  const courseData = await classTest.GetCourseAssignments('265289');
  const cleanCourseData = mapper.cleanCourseAssignments(courseData);
  console.log(cleanCourseData);
}


printEverything();
