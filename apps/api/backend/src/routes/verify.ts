import { Router } from 'express';
const router = Router();
import { CanvasClient, Canvas_API } from '../client/canvasclient';

// goal here would be getting a session set up, so we store a key in server, and then user saves key in browser that we identify with them

router.post('/verify', async (_req, res) => {
  const { apiKey } = _req.body;
  const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');
  try {
    const validKey = await canvasClientInstance.verifyKey(apiKey);
    if (validKey) {
      // send over hashed key so they can store in browser, hash on our side as well, and then when retreiving from database, we use local pepper to dehash and call
      // so MOST api calls will trigger that and ask for some in browser verification, we may try and store some recent data in browser or locally but other than that,
      // api calls will need to call db? or should it be some other way?
      res.send("Connection Successful!")
      // send to next page
    }
    else {
      res.status(500).json({ error: 'API Key invalid' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify key' });
  }
});

export default router;
