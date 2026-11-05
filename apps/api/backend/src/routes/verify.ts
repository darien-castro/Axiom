import { Router } from 'express';
import routeService from '../services/routeService';
const router = Router();

// goal here would be getting a session set up, so we store a key in server, and
// then user saves key in browser that we identify with them

router.post('/verify', async (_req, res) => {
  const { apiKey } = _req.body;
  try {
    const validKey: boolean = await routeService.checkUser(apiKey);
    if (validKey) {
      // send over hashed key so they can store in browser, hash on our side as well,
      // and then when retreiving from database, we use local pepper to dehash and call
      // so MOST api calls will trigger that and ask for some in browser verification,
      // we may try and store some recent data in browser or locally but other than that,
      // api calls will need to call db? or should it be some other way?
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
