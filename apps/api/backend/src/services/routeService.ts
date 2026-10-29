// api route helpers
import {
  CanvasClient,
  Canvas_API,
  CanvasCourse,
  CanvasAssignment,
  CanvasSubmission,
  CanvasEnrollment,
} from '../client/canvasclient';
import db, { CourseInfo, GradeInfo, UserInfo } from './databaseService';
import mapper, {
  CleanCourse,
  CleanCourseAssignment,
} from '../mapper/mapper';

export interface DashboardInfo {
  firstname: string
  lastname?: string
  courses?: CourseInfo[]
  gradeinfo?: GradeInfo[]
}

export type {
  CanvasCourse,
  CanvasAssignment,
  CanvasSubmission,
  CleanCourse,
  CleanCourseAssignment,
  UserInfo,
};

const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');

export async function ensureUser(apiKey: string): Promise<boolean> {
  try {
    const lastUpdate: Date | null = await db.lastUpdated(apiKey);
    const now: Date = new Date();

    if (!isGreaterThan20MinsApart(now, lastUpdate)) {
      try {
        const userID = await db.getUserIDByApiKey(apiKey);
        const userInfo = userID ? await db.getUserInfo(userID) : null;
        if (userInfo) {
          canvasClientInstance.m_apiKey = apiKey;
          return true;
        }
      } catch (error) {
        // Not found in DB, fallback to Canvas verification
      }
    }
  } catch (error) {
    // Database check failed, proceed with Canvas verification
  }

  const validKey = await canvasClientInstance.verifyKey(apiKey);
  if (validKey === true) {
    try {
      // Get from Canvas then push to DB
      const me = await canvasClientInstance.GetUserInformation();
      const cleanMe = mapper.cleanUserInformation(me);
      const userInfo: UserInfo = {
        userID: apiKey,
        firstName: cleanMe.firstName,
        lastName: cleanMe.lastName,
      };

      await db.pushGeneralUserInfo(userInfo);
      await db.syncUpdate(apiKey);
    } catch (err) {
      console.error('Error fetching or storing user info:', err);
    }
    return true;
  }
  return false;
}

export async function userRequestedVerifyRoute(apiKey: string): Promise<boolean> {
  try {
    return await ensureUser(apiKey);
  } catch (error) {
    throw error;
  }
}

export async function userRequestedCoursesRoute(apiKey: string): Promise<CleanCourse[] | null> {
  try {
    const lastUpdate: Date | null = await db.lastUpdated(apiKey);
    const now: Date = new Date();

    if (!isGreaterThan20MinsApart(now, lastUpdate)) {
      try {
        const dbCourses = await db.getUserCourses(apiKey);
        if (dbCourses && dbCourses.length > 0) {
          canvasClientInstance.m_apiKey = apiKey;
          return dbCourses;
        }
      } catch (error) {
        // Fallback to Canvas
      }
    }

    const validKey = await ensureUser(apiKey);
    if (validKey === true) {
      const courses = await canvasClientInstance.GetCourses();
      const cleanCourses = mapper.cleanCourses(courses);
      await db.pushCourseInformation(cleanCourses);
      await db.pushUserCourses(apiKey, cleanCourses.map((c) => c.courseID));
      await Promise.all(
        courses
          .filter((course) => cleanCourses.some((cleanCourse) => cleanCourse.courseID === String(course.id)))
          .map(async (course) => {
            const activeEnrollment = course.enrollments?.find(
              (enrollment: CanvasEnrollment) =>
                enrollment.enrollment_state === 'active' &&
                (enrollment.type === undefined || enrollment.type === 'student')
            );
            const grade = activeEnrollment?.computed_current_score ??
              activeEnrollment?.computed_current_grade;
            if (grade !== null && grade !== undefined && activeEnrollment?.user_id !== undefined) {
              await db.pushGradeInformation({
                userID: String(activeEnrollment.user_id),
                courseID: String(course.id),
                grade: String(grade),
              });
            }
          })
      );
      await db.syncUpdate(apiKey);
      return cleanCourses;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function userRequestedCourseRoute(
  apiKey: string,
  courseID: string
): Promise<CanvasCourse | null> {
  try {
    const lastUpdate: Date | null = await db.lastUpdated(apiKey);
    const now: Date = new Date();

    if (!isGreaterThan20MinsApart(now, lastUpdate)) {
      try {
        const dbCourseRows = await db.getCourseInformation(courseID);
        if (dbCourseRows && dbCourseRows.length > 0) {
          canvasClientInstance.m_apiKey = apiKey;
          const row = dbCourseRows[0];
          return {
            id: row.courseid,
            name: row.course_name,
            course_code: row.course_code || row.course_section,
          };
        }
      } catch (error) {
        // Fallback to Canvas
      }
    }

    const validKey = await ensureUser(apiKey);
    if (validKey === true) {
      const course = await canvasClientInstance.GetCourseData(courseID);
      if (course) {
        await db.pushCourseInformation([
          {
            courseID: String(course.id),
            courseName: course.name,
            courseCode: course.course_code,
          },
        ]);
        await db.pushUserCourses(apiKey, [String(course.id)]);

        const activeEnrollment = course.enrollments?.find(
          (enrollment: CanvasEnrollment) =>
            enrollment.enrollment_state === 'active' &&
            (enrollment.type === undefined || enrollment.type === 'student')
        );
        const grade = activeEnrollment?.computed_current_score ??
          activeEnrollment?.computed_current_grade;
        if (grade !== null && grade !== undefined && activeEnrollment?.user_id !== undefined) {
          await db.pushGradeInformation({
            userID: String(activeEnrollment.user_id),
            courseID: String(course.id),
            grade: String(grade),
          });
        }
      }
      await db.syncUpdate(apiKey);
      return course;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function userRequestedAssignmentsRoute(
  apiKey: string,
  courseID: string
): Promise<CleanCourseAssignment[] | null> {
  try {
    const lastUpdate: Date | null = await db.lastUpdated(apiKey);
    const now: Date = new Date();

    if (!isGreaterThan20MinsApart(now, lastUpdate)) {
      try {
        const dbAssignments = await db.getAssignments(courseID);
        if (dbAssignments && dbAssignments.length > 0) {
          canvasClientInstance.m_apiKey = apiKey;
          return dbAssignments.map((a: any) => ({
            courseId: a.courseid || courseID,
            assignmentName: a.name,
            assignmentType: a.type,
            assignmentPoints:
              a.points !== null && a.points !== undefined ? Number(a.points) : null,
          }));
        }
      } catch (error) {
        // Fallback to Canvas
      }
    }

    const validKey = await ensureUser(apiKey);
    if (validKey === true) {
      const assignments = await canvasClientInstance.GetCourseAssignments(courseID);
      const cleanAssignments = mapper.cleanCourseAssignments(assignments);
      await db.pushAssignments(courseID, assignments);
      await db.syncUpdate(apiKey);
      return cleanAssignments;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function userRequestedAssignmentRoute(
  apiKey: string,
  courseID: string,
  assignmentID: string
): Promise<CanvasAssignment | null> {
  try {
    const lastUpdate: Date | null = await db.lastUpdated(apiKey);
    const now: Date = new Date();

    if (!isGreaterThan20MinsApart(now, lastUpdate)) {
      try {
        const dbAssignment = await db.getAssignment(assignmentID);
        if (dbAssignment) {
          canvasClientInstance.m_apiKey = apiKey;
          return {
            id: dbAssignment.assignmentid || assignmentID,
            course_id: dbAssignment.courseid || courseID,
            name: dbAssignment.name,
            grading_type: dbAssignment.type,
            points_possible:
              dbAssignment.points !== null && dbAssignment.points !== undefined
                ? Number(dbAssignment.points)
                : null,
          };
        }
      } catch (error) {
        // Fallback to Canvas
      }
    }

    const validKey = await ensureUser(apiKey);
    if (validKey === true) {
      const assignment = await canvasClientInstance.GetCourseAssignment(courseID, assignmentID);
      if (assignment) {
        await db.pushAssignments(courseID, [assignment]);
      }
      await db.syncUpdate(apiKey);
      return assignment;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function userRequestedDashboardRoute(apiKey: string): Promise<DashboardInfo | null> {
  if (!apiKey || typeof apiKey !== 'string') {
    return null;
  }

  const [userInfo, courses] = await Promise.all([
    userRequestedmeRoute(apiKey),
    userRequestedCoursesRoute(apiKey),
  ]);

  if (!userInfo || !courses) {
    return null;
  }

  const gradeinfo = await db.getUserGradeInformation(userInfo.userID);

  return {
    firstname: userInfo.firstName,
    lastname: userInfo.lastName,
    courses,
    gradeinfo,
  };
}

export async function userRequestedSubmissionsRoute(
  apiKey: string,
  courseID: string,
  _assignmentID?: string
): Promise<CanvasSubmission[] | null> {
  try {
    const lastUpdate: Date | null = await db.lastUpdated(apiKey);
    const now: Date = new Date();

    if (!isGreaterThan20MinsApart(now, lastUpdate)) {
      try {
        const dbSubmissions = await db.getSubmissions(courseID, apiKey);
        if (dbSubmissions && dbSubmissions.length > 0) {
          canvasClientInstance.m_apiKey = apiKey;
          return dbSubmissions.map((s: any) => ({
            id: s.submissionid,
            assignment_id: s.assignmentid,
            course_id: s.courseid,
            score: s.score !== null && s.score !== undefined ? Number(s.score) : null,
            grade: s.grade,
            submitted_at: s.submitted_at,
          }));
        }
      } catch (error) {
        // Fallback to Canvas
      }
    }

    const validKey = await ensureUser(apiKey);
    if (validKey === true) {
      const submissions = await canvasClientInstance.GetCourseSubmissions(courseID);
      await db.pushSubmissions(courseID, apiKey, submissions);
      await db.syncUpdate(apiKey);
      return submissions;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function userRequestedmeRoute(apiKey: string): Promise<UserInfo | null> {
  try {
    try {
      const lastUpdate: Date | null = await db.lastUpdated(apiKey);
      const now: Date = new Date();
      if (!isGreaterThan20MinsApart(now, lastUpdate)) {
        // less than 20 minutes old, get from db
        try {
          const userInfo = await db.getUserInfo(apiKey);
          if (userInfo) {
            canvasClientInstance.m_apiKey = apiKey;
            return userInfo;
          }
        } catch (error) {
          // not found in db, fallback to canvas
        }
      }
    } catch (error) {
      // db error, fallback to canvas
    }

    const validKey = await canvasClientInstance.verifyKey(apiKey);

    if (validKey === true) {
      // get from canvas then push to db
      const me = await canvasClientInstance.GetUserInformation();
      const cleanMe = mapper.cleanUserInformation(me);
      const userInfo: UserInfo = {
        userID: cleanMe.userID,
        firstName: cleanMe.firstName,
        lastName: cleanMe.lastName,
      };

      await db.pushGeneralUserInfo(userInfo);
      await db.syncUpdate(apiKey);
      return userInfo;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function updateAllTables() {

}

export default {
  userRequestedmeRoute,
  userRequestedVerifyRoute,
  userRequestedCoursesRoute,
  userRequestedCourseRoute,
  userRequestedAssignmentsRoute,
  userRequestedAssignmentRoute,
  userRequestedSubmissionsRoute,
  userRequestedDashboardRoute,
  ensureUser,
};

function isGreaterThan20MinsApart(date1: Date | null, date2: Date | null): boolean {
  if (date1 == null || date2 == null) {
    return true;
  }
  const TWENTY_MINUTES_IN_MS = 20 * 60 * 1000;
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());
  return diffInMs > TWENTY_MINUTES_IN_MS;
}
