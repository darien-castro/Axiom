const API = require('./canvas-API.js');

const addon = require('../build/Release/addon.node');

API.get_user_courses().then(courses => {
  console.log(courses);
});


console.log(addon.hello());              

