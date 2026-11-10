// route for assignments in canvas at 'courseID'
// /api/courses/:courseID/assignments

import { Router } from 'express';
import routeService, { CleanCourseAssignment } from '../services/routeService';
import authenticateSession from '../middleware/auth';

const router = Router();

router.use(authenticateSession);

const handleAssignments = async (_req: any, res: any) => {
  const apiKey = _req.apiKey || _req.body?.apiKey;
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
};

router.get('/courses/:courseID/assignments', handleAssignments);
router.post('/courses/:courseID/assignments', handleAssignments);

export default router;
