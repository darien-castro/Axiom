// /api/courses/:courseID/submissions
import { Router } from 'express';
import routeService, { CanvasSubmission } from '../services/routeService';
import authenticateSession from '../middleware/auth';

const router = Router();

router.use(authenticateSession);

const handleSubmissions = async (_req: any, res: any) => {
  const apiKey = _req.apiKey || _req.body?.apiKey;
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
};

router.get('/courses/:courseID/submissions', handleSubmissions);
router.post('/courses/:courseID/submissions', handleSubmissions);

export default router;
