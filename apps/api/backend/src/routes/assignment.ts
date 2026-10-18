// route for individual assignment in canvas at 'courseID', 'assignmentID'
// /api/courses/:courseID/:assignmentID

import { Router } from 'express';
import { CanvasClient, Canvas_API } from '../client/canvasclient';
import mapper from '../mapper/mapper'
const router = Router();



router.post('/courses/:courseID/:assignmentID', async (_req, res) => {
  const { apiKey } = _req.body;
  const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const courseID = _req.params['courseID'];
      const assignmentID = _req.params['assignmentID'];
      const assignments = await canvasClientInstance.GetCourseAssignment(courseID, assignmentID);
      // TODO don't have assignment cleaner individually
       res.send({ assignments });
    }
    else {
      res.status(500).json(`Error: Invalid API Key`);
    }
    } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
