// route for assignments in canvas at 'courseID'
// /api/courses/:courseID/assignments

import { Router } from 'express';
import { CanvasRequestError } from '../client/canvasclient';
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

router.get('/courses/:courseID/assignments/availability', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  if (typeof req.apiKey !== 'string' || !req.apiKey.trim()) {
    res.status(401).json({ error: 'A valid session or Canvas API key is required' });
    return;
  }

  try {
    const assignments = await routeService.userRequestedAssignmentAvailability(req.apiKey, req.params.courseID);
    res.json({ assignments });
  } catch (error) {
    if (error instanceof CanvasRequestError && [401, 403, 404].includes(error.status)) {
      res.status(error.status).json({ error: 'Canvas denied access to the course or it could not be found' });
      return;
    }
    res.status(502).json({ error: 'Failed to retrieve assignment availability from Canvas' });
  }
});

export default router;
