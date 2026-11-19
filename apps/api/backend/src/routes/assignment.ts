// route for individual assignment in canvas at 'courseID', 'assignmentID'
// /api/courses/:courseID/:assignmentID

import { Router } from 'express';
import routeService, { CanvasAssignment } from '../services/routeService';
const router = Router();

router.post('/courses/:courseID/:assignmentID', async (_req, res) => {
  const { apiKey } = _req.body;
  const courseID = _req.params['courseID'];
  const assignmentID = _req.params['assignmentID'];
  try {
    const assignments: CanvasAssignment | null = await routeService.userRequestedAssignmentRoute(apiKey, courseID, assignmentID);
    if (!assignments) {
      res.status(500).json({ error: 'Error: Invalid API Key' });
      return;
    }
    // TODO don't have assignment cleaner individually
    res.send({ assignments });
  } catch {
    console.error('Individual assignment request failed');
    res.status(500).json({ error: 'Failed to retrieve assignment' });
  }
});

export default router;
