// /api/courses/:courseID/submissions
import { Router } from 'express';
import routeService, { CanvasSubmission } from '../services/routeService';
const router = Router();

router.post('/courses/:courseID/submissions', async (_req, res) => {
  const { apiKey } = _req.body;
  const courseID = _req.params.courseID;
  try {
    const submissions: CanvasSubmission[] | null = await routeService.userRequestedSubmissionsRoute(apiKey, courseID);
    if (!submissions) {
      res.status(500).json({ error: 'Error: Invalid API Key' });
      return;
    }
    // TODO no mapper for submissions yet
    res.send({ submissions });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
