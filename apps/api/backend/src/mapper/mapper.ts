export interface CleanCourse {
  courseID: string;
  courseName: string;
  courseTermId: string;
  courseTerm: string;
  courseCode: string;
  courseSection: string;
  courseDepartment: string;
}

export interface CleanCourseGrade {
  courseid: string;
  coursescore: number | null | undefined;
}

export interface CleanCourseAssignment {
  courseId: string | number;
  assignmentName: string;
  assignmentType: string | undefined;
  assignmentPoints: number | null | undefined;
}

export interface CleanUserInfo {
  firstName: string;
  lastName: string;
  userID: string;
}

export function cleanCourses(
  coursesArray: Array<{ id: string | number; name?: string; [key: string]: any }>
): CleanCourse[] {
  const academicCourseRegex = /^(\d{6})-(.*?)-([A-Z]{3,4})-(\d{4})-(\d{3})-(.*)$/;

  return coursesArray.flatMap((course) => {
    if (!course.name) return [];

    const match = course.name.match(academicCourseRegex);

    if (match) {
      return [
        {
          courseID: String(course.id),
          courseName: match[6],
          courseTermId: match[1],
          courseTerm: match[2],
          courseCode: match[4],
          courseSection: match[5],
          courseDepartment: match[3],
        },
      ];
    } else {
      return [];
    }
  });
}

export function cleanCourseGrades(
  coursesArray: Array<{
    course_id: string | number;
    grades?: { current_score?: number | null; [key: string]: any };
    [key: string]: any;
  }>
): CleanCourseGrade[] {
  return coursesArray.map((course) => {
    return {
      courseid: String(course.course_id),
      coursescore: course.grades?.current_score,
    };
  });
}

export function cleanCourseAssignments(
  assignmentsArray: Array<{
    course_id: string | number;
    name: string;
    grading_type?: string;
    points_possible?: number | null;
    [key: string]: any;
  }>
): CleanCourseAssignment[] {
  return assignmentsArray.map((assignment) => {
    return {
      courseId: assignment.course_id,
      assignmentName: assignment.name,
      assignmentType: assignment.grading_type,
      assignmentPoints: assignment.points_possible,
    };
  });
}

export function cleanUserInformation(userInfo: {
  first_name?: string;
  last_name?: string;
  id: string | number;
  [key: string]: any;
}): CleanUserInfo {
  return {
    firstName: userInfo.first_name || '',
    lastName: userInfo.last_name || '',
    userID: String(userInfo.id),
  };
}

export default {
  cleanCourses,
  cleanCourseGrades,
  cleanCourseAssignments,
  cleanUserInformation,
};
