function cleanCourses(coursesArray) {
  // get general setup for how courses look
  const academicCourseRegex = /^(\d{6})-(.*?)-([A-Z]{3,4})-(\d{4})-(\d{3})-(.*)$/;
    return coursesArray.map(course => {
      const match = course.name.match(academicCourseRegex);
      if (match){
        return{
          // general parsing
          courseID: String(course.id),
          courseName: match[6],
          courseTermId: match[1],
          courseTerm: match[2],
          courseCode: match[4],
          courseSection: match[5],
          courseDepartment: match[3]
        }
      }
      else{
        return{
        // need to fix possible case
        }
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
    userID: userInfo.id 
  };
}
module.exports = {cleanCourses, cleanCourseGrades, cleanCourseAssignments, cleanUserInformation}
