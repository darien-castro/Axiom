const API = require('./canvas-API.js');

const addon = require('../build/Release/addon.node');

API.get_user_courses().then(courses => {
  // looping through and getting only names
  for (course_name of courses){
    console.log(course_name);
  };
});

console.log(addon.hello()); 


