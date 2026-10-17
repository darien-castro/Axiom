import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { CanvasClient, Canvas_API } from './client/canvasclient';
import mapper from './mapper/mapper';
import crypto from './crypto/crypto';

const app = express();
const PORT = process.env.PORT || 5000;


// Basic health check route
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy' });
});

const apiKey = process.env.CANVAS_API_KEY;
if (!apiKey) throw new Error('CANVAS_API_KEY is not set');
const classTest: CanvasClient = new Canvas_API('https://instructure.charlotte.edu', apiKey);

app.use(cors({ origin: 'http://localhost:3001' }));

app.get("/", (req, res) => {
    res.send("Connection Successful!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
export { app, classTest, crypto };
export default app;
