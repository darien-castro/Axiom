// api route helpers
import {
  CanvasClient,
  Canvas_API,
  CanvasCourse,
  CanvasAssignment,
  CanvasSubmission,
} from '../client/canvasclient';
import db, { UserInfo } from './databaseService';
import mapper, {
  CleanCourse,
  CleanCourseAssignment,
} from '../mapper/mapper';

export type {
  CanvasCourse,
  CanvasAssignment,
  CanvasSubmission,
  CleanCourse,
  CleanCourseAssignment,
  UserInfo,
};

const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');

export async function userRequestedVerifyRoute(apiKey: string): Promise<boolean> {
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    return validKey;
  } catch (error) {
    throw error;
  }
}

export async function userRequestedCoursesRoute(apiKey: string): Promise<CleanCourse[] | null> {
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const courses = await canvasClientInstance.GetCourses();
      const cleanCourses = mapper.cleanCourses(courses);
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
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const course = await canvasClientInstance.GetCourseData(courseID);
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
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const assignments = await canvasClientInstance.GetCourseAssignments(courseID);
      const cleanAssignments = mapper.cleanCourseAssignments(assignments);
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
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const assignment = await canvasClientInstance.GetCourseAssignment(courseID, assignmentID);
      return assignment;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

export async function userRequestedSubmissionsRoute(
  apiKey: string,
  courseID: string
): Promise<CanvasSubmission[] | null> {
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const submissions = await canvasClientInstance.GetCourseSubmissions(courseID);
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
    // TODO sessions: encrypt api key here using encryption method (probably using other crypto/session service)
    //
    const validKey = await canvasClientInstance.verifyKey(apiKey);

    if (validKey === true) {

      const lastUpdate: Date | null = await  db.lastUpdated(apiKey) // encrypt
      const now: Date = new Date()
      if (isGreaterThan20MinsApart(now, lastUpdate)) {
        console.log("Greater than 20 mins")
        // get from canvas then push to db
        const me = await canvasClientInstance.GetUserInformation();
        const cleanMe = mapper.cleanUserInformation(me);
        const userInfo: UserInfo = {
          userID: apiKey, // TODO encrypt
          firstName: cleanMe.firstName,
          lastName: cleanMe.lastName
        };

        await db.pushGeneralUserInfo(userInfo);
        await db.syncUpdate(apiKey); // TODO encrypt
        return userInfo;
      }
      else {
        // less than 20 minutes old
        // get from db
        try {
        const userInfo = await db.getUserInfo(apiKey) // TODO encrypted key
        return userInfo;
        }
        catch (error) {
          throw error;
        }
      }

    }
    else {
      return null;
  }
  } catch (error) {
    throw error;
  }
}


export default {
  userRequestedmeRoute,
  userRequestedVerifyRoute,
  userRequestedCoursesRoute,
  userRequestedCourseRoute,
  userRequestedAssignmentsRoute,
  userRequestedAssignmentRoute,
  userRequestedSubmissionsRoute,
};

function isGreaterThan20MinsApart(date1: Date | null, date2: Date | null): boolean {
  if (date1 == null || date2 == null) {
    return true;
  }
  const TWENTY_MINUTES_IN_MS = 20 * 60 * 1000;
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());
  return diffInMs > TWENTY_MINUTES_IN_MS;
}
