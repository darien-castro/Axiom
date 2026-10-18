import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { CanvasClient, Canvas_API } from './client/canvasclient';
import mapper from './mapper/mapper';
import crypto from './crypto/crypto';


// route stuff
const app = express();
const PORT = process.env.PORT || 5000;
import verifyRoute from './routes/verify'
import coursesRoute from './routes/courses'
import courseRoute from './routes/course'
import assignmentsRoute from './routes/assignments'
import submissionsRoute from './routes/submissions'



// Basic health check route
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy' });
});

const apiKey = process.env.CANVAS_API_KEY;

if (!apiKey) throw new Error('CANVAS_API_KEY is not set');

const classTest: CanvasClient = new Canvas_API('https://instructure.charlotte.edu');


// ideally, once released, would only allow access from one server
app.use(cors());

// main routes
app.get("/", (req, res) => {
    res.send("Connection Successful!");
});

app.use(express.json());
app.use('/api', verifyRoute);
app.use('/api', coursesRoute);
app.use('/api', courseRoute);
app.use('/api', assignmentsRoute);
app.use('/api', submissionsRoute)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
export { app, classTest, crypto };
export default app;
