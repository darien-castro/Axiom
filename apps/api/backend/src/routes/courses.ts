// returns all courses from a given api key
//
// after db is fully added, will check with db first to compare some data and
// then switch to db mode, and just grab from db

import { Router } from 'express';
import routeService, { CleanCourse } from '../services/routeService';
const router = Router();

router.post('/courses', async (_req, res) => {
  const { apiKey } = _req.body;
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
});

export default router;
