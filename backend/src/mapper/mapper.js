
const crypto = require('../crypto/crypto.js')

function cleanCourses(coursesArray) {
  const academicCourseRegex = /^(\d{6})-(.*?)-([A-Z]{3,4})-(\d{4})-(\d{3})-(.*)$/;
  
  // Use flatMap instead of map
  return coursesArray.flatMap(course => {
    const match = course.name.match(academicCourseRegex);
    
    if (match) {
      // Wrap the returned object in an array
      return [{
        courseID: String(course.id),
        courseName: match[6],
        courseTermId: match[1],
        courseTerm: match[2],
        courseCode: match[4],
        courseSection: match[5],
        courseDepartment: match[3]
      }];
    } else {
      // Return an empty array. flatMap will just ignore it.
      return []; 
    }
  });
}

function cleanCourseGrades(coursesArray){
  return coursesArray.map(course => {
      return{
        courseid: String(course.course_id),
        coursescore: course.grades.current_score
      }
    
  })
}

function cleanCourseAssignments(assignmentsArray){
  return assignmentsArray.map(assignment => {
      return{
        courseId: assignment.course_id,
        assignmentName: assignment.name,
        assignmentType: assignment.grading_type,
        assignmentPoints: assignment.points_possible
      }
    
  })
}
function cleanUserInformation(userInfo) {
  return {
    firstName: userInfo.first_name, 
    lastName: userInfo.last_name,
    userID: crypto.sha256(userInfo.id)
  };
}

module.exports = {cleanCourses, cleanCourseGrades, cleanCourseAssignments, cleanUserInformation}
