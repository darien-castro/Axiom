// returns all courses from a given api key
//
// after db is fully added, will check with db first to compare some data and
// then switch to db mode, and just grab from db

import { Router } from 'express';
import { CanvasClient, Canvas_API } from '../client/canvasclient';
import mapper from '../mapper/mapper'
const router = Router();



router.post('/courses', async (_req, res) => {
  const { apiKey } = _req.body;
  const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const courses = await canvasClientInstance.GetCourses();
      const cleanCourses = mapper.cleanCourses(courses);
       res.send({ cleanCourses });
    }
    else {
      res.status(500).json(`Error: Invalid API Key`);
    }
    } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
