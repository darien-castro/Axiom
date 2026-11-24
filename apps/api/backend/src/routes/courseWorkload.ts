import { Router, type Request, type RequestHandler, type Response } from 'express';
import { CanvasClient, CanvasRequestError, canvasBaseUrl, type CanvasCourse } from '../client/canvasclient';
import authenticateSession from '../middleware/auth';
import { cleanCourses } from '../mapper/mapper';
import db from '../services/databaseService';

const router = Router();

type StudentWorkload = { canvas: CanvasClient; studentId: string; courses: CanvasCourse[] };
type CourseParams = { courseID: string };
type AssignmentParams = CourseParams & { assignmentID: string };

function studentRoute<Params extends Partial<CourseParams>>(
  handler: (req: Request<Params>, res: Response, student: StudentWorkload) => Promise<void>,
): RequestHandler<Params> {
  return async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (typeof req.apiKey !== 'string' || !req.apiKey.trim()) {
      res.status(401).json({ error: 'Sign in with Canvas to view course work.' });
      return;
    }

    try {
      const canvas = new CanvasClient(canvasBaseUrl, req.apiKey);
      const [profile, courses] = await Promise.all([canvas.GetUserInformation(), canvas.GetActiveStudentCourses()]);
      if (req.params.courseID && !courses.some((course) => String(course.id) === req.params.courseID)) {
        res.status(404).json({ error: 'This course is not in your active Canvas enrollments.' });
        return;
      }
      await handler(req, res, { canvas, studentId: String(profile.id), courses });
    } catch (error) {
      const status = error instanceof CanvasRequestError ? error.status : 500;
      if (status === 401 || status === 403 || status === 404) {
        res.status(status).json({ error: 'Canvas did not give access to this data.' });
      } else {
        res.status(error instanceof CanvasRequestError ? 502 : 500).json({ error: 'Could not load or save course workload.' });
      }
    }
  };
}

router.get('/workload/courses', authenticateSession, studentRoute(async (req, res, { studentId, courses }) => {
  const includeAssignmentPreferences = req.query.includeAssignmentPreferences === 'true';
  const [creditRows, hiddenRows, dismissedAssignments, timeReports, focusedAssignments, gpaTranscript] = await Promise.all([
    db.getCourseCreditHours(studentId),
    db.getHiddenCourses(studentId),
    includeAssignmentPreferences ? db.getDismissedAssignments(studentId) : undefined,
    includeAssignmentPreferences ? db.getStudentTimeReports(studentId) : undefined,
    includeAssignmentPreferences ? db.getFocusedAssignments(studentId) : undefined,
    req.query.includeGpaTranscript === 'true' ? db.getGpaTranscriptTotals(studentId) : undefined,
  ]);
  const credits = new Map(creditRows.map((course) => [course.courseId, course.creditHours]));
  const hidden = new Set(hiddenRows.map((course) => course.courseId));
  res.json({ dismissedAssignments, timeReports, focusedAssignments, gpaTranscript, courses: courses.map((course) => {
    const courseId = String(course.id);
    const [clean] = cleanCourses([course]);
    const student = course.enrollments?.find((enrollment) => enrollment.type === 'student' || enrollment.type === 'StudentEnrollment');
    return {
      courseId,
      courseName: clean?.courseName || course.name || course.course_code || `Course ${courseId}`,
      courseCode: clean ? `${clean.courseDepartment} ${clean.courseCode}` : course.course_code ?? null,
      term: course.term?.name ?? clean?.courseTerm ?? null,
      gradeScore: student?.computed_current_score ?? null,
      gradeLetter: student?.computed_current_grade ?? null,
      creditHours: credits.get(courseId) ?? null,
      hidden: hidden.has(courseId),
      canvasUrl: `${canvasBaseUrl}/courses/${encodeURIComponent(courseId)}`,
    };
  }) });
}));

function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

router.put('/workload/gpa-setup', authenticateSession, studentRoute(async (req, res, { studentId, courses }) => {
  const { credits, transcript } = req.body ?? {};
  const activeCourseIds = new Set(courses.map(({ id }) => String(id)));
  if (!Array.isArray(credits) || credits.length > activeCourseIds.size || credits.some((entry) =>
    !activeCourseIds.has(entry?.courseId) || !isNonnegativeNumber(entry?.creditHours)
  ) || new Set(credits.map(({ courseId }) => courseId)).size !== credits.length) {
    res.status(400).json({ error: 'Enter valid credit hours for each active course.' });
    return;
  }

  if (transcript !== undefined && (
    typeof transcript?.semesterKey !== 'string' || !transcript.semesterKey.trim() ||
    transcript.semesterKey.length > 2048 || !isNonnegativeNumber(transcript.gpaHours) ||
    !isNonnegativeNumber(transcript.qualityPoints) || transcript.qualityPoints > transcript.gpaHours * 4
  )) {
    res.status(400).json({ error: 'Check the prior GPA hours and quality points against your transcript.' });
    return;
  }

  credits.sort((a, b) => a.courseId.localeCompare(b.courseId));
  await db.saveGpaSetup(studentId, credits, transcript);
  res.json({ credits, transcript });
}));

router.put('/workload/assignments/focus', authenticateSession, studentRoute(async (req, res, { canvas, studentId, courses }) => {
  const { courseId, assignmentId, focused } = req.body ?? {};
  if (typeof courseId !== 'string' || !courseId || typeof assignmentId !== 'string' || !assignmentId || typeof focused !== 'boolean') {
    res.status(400).json({ error: 'An assignment, course, and focus state are required.' });
    return;
  }

  if (focused) {
    if (!courses.some(({ id }) => String(id) === courseId)) {
      res.status(404).json({ error: 'This course is not in your active Canvas enrollments.' });
      return;
    }
    const assignment = await canvas.GetCourseAssignment(courseId, assignmentId);
    if (String(assignment.id) !== assignmentId) {
      res.status(404).json({ error: 'This assignment could not be found in Canvas.' });
      return;
    }
  }

  await db.saveAssignmentFocus(studentId, courseId, assignmentId, focused);
  res.json({ focused });
}));

router.put('/workload/assignments/dismissal', authenticateSession, studentRoute(async (req, res, { canvas, studentId, courses }) => {
  const { courseId, assignmentId, dismissed } = req.body ?? {};
  if (typeof courseId !== 'string' || !courseId || typeof assignmentId !== 'string' || !assignmentId || typeof dismissed !== 'boolean') {
    res.status(400).json({ error: 'An assignment, course, and dismissal state are required.' });
    return;
  }

  if (!dismissed) {
    await db.restoreAssignment(studentId, courseId, assignmentId);
    res.json({ dismissedAssignment: null });
    return;
  }

  const course = courses.find(({ id }) => String(id) === courseId);
  if (!course) {
    res.status(404).json({ error: 'This course is not in your active Canvas enrollments.' });
    return;
  }

  const assignment = await canvas.GetCourseAssignment(courseId, assignmentId);
  if (String(assignment.id) !== assignmentId) {
    res.status(404).json({ error: 'This assignment could not be found in Canvas.' });
    return;
  }
  const dismissedAssignment = {
    courseId, assignmentId,
    courseName: cleanCourses([course])[0]?.courseName || course.name,
    assignmentName: assignment.name,
  };
  await db.dismissAssignment(studentId, dismissedAssignment);
  res.json({ dismissedAssignment });
}));

router.put('/workload/courses/:courseID/visibility', authenticateSession, studentRoute<CourseParams>(async (req, res, { studentId }) => {
  const hidden = req.body?.hidden;
  if (typeof hidden !== 'boolean') {
    res.status(400).json({ error: 'Choose whether to hide this course.' });
    return;
  }

  await db.saveCourseVisibility(studentId, req.params.courseID, hidden);
  res.json({ hidden });
}));

router.put('/workload/courses/:courseID/credits', authenticateSession, studentRoute<CourseParams>(async (req, res, { studentId }) => {
  const creditHours = req.body?.creditHours;
  if (typeof creditHours !== 'number' || !Number.isFinite(creditHours) || creditHours < 0) {
    res.status(400).json({ error: 'Enter a nonnegative number of credit hours.' });
    return;
  }

  await db.saveCourseCreditHours(studentId, req.params.courseID, creditHours);
  res.json({ creditHours });
}));

router.put('/workload/courses/:courseID/assignments/:assignmentID/time', authenticateSession, studentRoute<AssignmentParams>(async (req, res, { canvas, studentId }) => {
  const minutes = req.body?.minutes;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 2_147_483_647) {
    res.status(400).json({ error: 'Enter a positive whole number of minutes.' });
    return;
  }

  const { courseID, assignmentID } = req.params;
  const assignment = await canvas.GetCourseAssignment(courseID, assignmentID);
  if (String(assignment.id) !== assignmentID) {
    res.status(404).json({ error: 'This assignment could not be found in Canvas.' });
    return;
  }
  await db.saveAssignmentTimeReport(studentId, courseID, assignmentID, minutes);
  res.json(await timeEstimate(courseID, assignmentID));
}));

router.delete('/workload/courses/:courseID/assignments/:assignmentID/time', authenticateSession, studentRoute<AssignmentParams>(async (req, res, { studentId }) => {
  const { courseID, assignmentID } = req.params;
  await db.removeAssignmentTimeReport(studentId, courseID, assignmentID);
  res.json(await timeEstimate(courseID, assignmentID));
}));

async function timeEstimate(courseID: string, assignmentID: string) {
  const estimate = (await db.getAssignmentTimeEstimates(courseID)).find((entry) => entry.assignmentId === assignmentID);
  return { estimatedMinutes: estimate?.estimatedMinutes ?? null, reportCount: estimate?.reportCount ?? 0 };
}

export default router;
