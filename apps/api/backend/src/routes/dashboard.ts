import { Router } from 'express';
import dashboardRoute, { DashboardInfo } from '../services/routeService';
import authenticateSession from '../middleware/auth';

const router = Router();

router.use(authenticateSession);

const handleDashboard = async (req: any, res: any) => {
  const apiKey = req.apiKey || req.body?.apiKey;
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    res.status(400).json({ error: 'API Key is required' });
    return;
  }

  try {
    const x: DashboardInfo | null = await dashboardRoute.userRequestedDashboardRoute(apiKey);
    if (!x) {
      res.status(401).json({ error: 'Error: Invalid API Key' });
      return;
    }
    res.json(x);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load dashboard' });
  }
};

router.get('/dashboard', handleDashboard);
router.post('/dashboard', handleDashboard);

export default router;
