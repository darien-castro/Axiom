// route for user/self
// /api/me

import { Router } from 'express';
import { CanvasClient, Canvas_API } from '../client/canvasclient';
import mapper from '../mapper/mapper'
import meRoute from '../services/routeService'
import { UserInfo } from '../services/databaseService';
const router = Router();


router.post('/me', async (_req, res) => {
  const { apiKey } = _req.body;
  try {
    const x: UserInfo | null = await meRoute.userRequestedmeRoute(apiKey);
    if (!x) {
      res.status(500).json({ error: "Error: There was an error accesing the Database" })
      return
    }
    else if (x == null) {
      res.status(500).json({ error: "Error: Something went wrong with your  API KEY" })
      return
    }
    else
      res.send(x);
  }
  catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
