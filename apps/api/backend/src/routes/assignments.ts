// route for assignments in canvas at 'courseID'
// /api/courses/:courseID/assignments

import { Router } from 'express';
import routeService, { CleanCourseAssignment } from '../services/routeService';
const router = Router();

router.post('/courses/:courseID/assignments', async (_req, res) => {
  const { apiKey } = _req.body;
  const courseID = _req.params.courseID;
  try {
    const cleanAssignments: CleanCourseAssignment[] | null = await routeService.userRequestedAssignmentsRoute(apiKey, courseID);
    if (!cleanAssignments) {
      res.status(500).json({ error: 'Error: Invalid API Key' });
      return;
    }
    res.send({ cleanAssignments });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
