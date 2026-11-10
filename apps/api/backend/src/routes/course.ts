// route for specific courses
// /api/courses/:courseID

import { Router } from 'express';
import routeService, { CanvasCourse } from '../services/routeService';
import authenticateSession from '../middleware/auth';

const router = Router();

router.use(authenticateSession);

const handleCourse = async (_req: any, res: any) => {
  const apiKey = _req.apiKey || _req.body?.apiKey;
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
};

router.get('/courses/:courseID', handleCourse);
router.post('/courses/:courseID', handleCourse);

export default router;
