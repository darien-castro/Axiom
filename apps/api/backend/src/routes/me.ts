// route for user/self
// /api/me

import { Router } from 'express';
import meRoute, { UserInfo } from '../services/routeService';
const router = Router();

router.post('/me', async (_req, res) => {
  const { apiKey } = _req.body;
  try {
    const x: UserInfo | null = await meRoute.userRequestedmeRoute(apiKey);
    if (!x) {
      res.status(500).json({ error: "Error: Something went wrong with your API Key or Database" });
      return;
    }
    res.send(x);
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
});

export default router;
