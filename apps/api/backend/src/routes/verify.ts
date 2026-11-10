import { Router } from 'express';
import crypto from 'node:crypto';
import routeService from '../services/routeService';
import db from '../services/databaseService';

const router = Router();

// goal here would be getting a session set up, so we store a key in server, and
// then user saves key in browser that we identify with them

// Quick route to check if current session cookie is valid
router.get('/verify', async (_req, res) => {
  const sessionKey = _req.session?.sessionKey;
  if (!sessionKey) {
    res.status(401).json({ valid: false, error: 'No active session' });
    return;
  }
  try {
    const valid = await db.isSessionValid(sessionKey);
    if (valid) {
      res.json({ valid: true, message: 'Session is valid' });
    } else {
      res.status(401).json({ valid: false, error: 'Session is invalid or expired' });
    }
  } catch (error) {
    res.status(500).json({ valid: false, error: `${error}` });
  }
});

router.post('/verify', async (_req, res) => {
  const { apiKey } = _req.body;
  if (!apiKey) {
    res.status(400).json({ error: 'API key is required' });
    return;
  }
  try {
    const validKey: boolean = await routeService.checkUser(apiKey);
    if (validKey) {
      const cookie = crypto.randomUUID();

      await db.insertSessionKey(cookie, apiKey);

      if (_req.session) {
        _req.session.sessionKey = cookie;
      }

      res.send('Connection Successful!');
      // send to next page
    } else {
      res.status(401).json({ error: 'API Key invalid' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify key' });
  }
});

export default router;
