// route for user/self
// /api/me

import { Router } from 'express';
import meRoute, { UserInfo } from '../services/routeService';
import authenticateSession from '../middleware/auth';
import { CanvasClient, CanvasRequestError, canvasBaseUrl } from '../client/canvasclient';

const router = Router();

router.use(authenticateSession);

router.get('/me/profile', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const profile = await new CanvasClient(canvasBaseUrl, req.apiKey).GetUserInformation();
    const avatarUrl = typeof profile.avatar_url === 'string' && profile.avatar_url.startsWith('https://')
      ? profile.avatar_url : null;
    res.json({ name: profile.name, avatarUrl });
  } catch (error) {
    const status = error instanceof CanvasRequestError && error.status === 401 ? 401 : 502;
    res.status(status).json({ error: 'Could not load the Canvas profile.' });
  }
});

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
