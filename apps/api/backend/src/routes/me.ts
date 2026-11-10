// route for user/self
// /api/me

import { Router } from 'express';
import meRoute, { UserInfo } from '../services/routeService';
import authenticateSession from '../middleware/auth';

const router = Router();

router.use(authenticateSession);

const handleMe = async (_req: any, res: any) => {
  const apiKey = _req.apiKey || _req.body?.apiKey;
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
};

router.get('/me', handleMe);
router.post('/me', handleMe);

export default router;
