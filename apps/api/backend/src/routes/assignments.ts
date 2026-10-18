// route for assignments in canvas at 'courseID'
// /api/courses/:courseID/Assignments

import { Router } from 'express';
import { CanvasClient, Canvas_API } from '../client/canvasclient';
import mapper from '../mapper/mapper'
const router = Router();



router.post('/courses/:courseID/assignments', async (_req, res) => {
  const { apiKey } = _req.body;
  const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const courseID = _req.params.courseID
      const assignments = await canvasClientInstance.GetCourseAssignments(courseID);
      const cleanAssignments = mapper.cleanCourseAssignments(assignments);
       res.send({ cleanAssignments });
    }
    else {
      res.status(500).json(`Error: Invalid API Key`);
    }
    } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
