// returns all courses from a given api key
//
// after db is fully added, will check with db first to compare some data and
// then switch to db mode, and just grab from db

import { Router } from 'express';
import routeService, { CleanCourse } from '../services/routeService';
import authenticateSession from '../middleware/auth';

const router = Router();

router.use(authenticateSession);

const handleCourses = async (_req: any, res: any) => {
  const apiKey = _req.apiKey || _req.body?.apiKey;
  try {
    const cleanCourses: CleanCourse[] | null = await routeService.userRequestedCoursesRoute(apiKey);
    if (!cleanCourses) {
      res.status(500).json({ error: 'Error: Invalid API Key' });
      return;
    }
    res.send({ cleanCourses });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

router.get('/courses', handleCourses);
router.post('/courses', handleCourses);

export default router;
