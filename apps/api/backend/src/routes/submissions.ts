// /api/courses/:courseID/submissions
import { Router } from 'express';
import { CanvasClient, Canvas_API } from '../client/canvasclient';
import mapper from '../mapper/mapper'
const router = Router();

router.post('/courses/:courseID/submissions', async (_req, res) => {
  const { apiKey } = _req.body;
  const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey === true) {
      const courseID = _req.params.courseID
      const submissions = await canvasClientInstance.GetCourseSubmissions(courseID);
      // TODO no mapper for submissions yet
       res.send({ submissions });
    }
    else {
      res.status(500).json(`Error: Invalid API Key`);
    }
    } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
