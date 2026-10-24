// route for specific courses
// /api/courses/:courseID

import { Router } from 'express';
import routeService, { CanvasCourse } from '../services/routeService';
const router = Router();

router.post('/courses/:courseID', async (_req, res) => {
  const { apiKey } = _req.body;
  const courseID = _req.params.courseID;
  try {
    const course: CanvasCourse | null = await routeService.userRequestedCourseRoute(apiKey, courseID);
    if (!course) {
      res.status(500).json({ error: 'Error: Invalid API Key' });
      return;
    }
    res.send({ course });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
