import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from './crypto/crypto';

// user classes
import db from './services/databaseService'

// route stuff
const app = express();
const PORT = process.env.PORT || 5000;
import verifyRoute from './routes/verify'
import coursesRoute from './routes/courses'
import courseRoute from './routes/course'
import assignmentsRoute from './routes/assignments'
import assignmentRoute from './routes/assignment'
import submissionsRoute from './routes/submissions'
import selfRoute from './routes/me'


db.initAllTables();


// Basic health check route
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy' });
});


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
app.use('/api', assignmentRoute);
app.use('/api', submissionsRoute)
app.use('/api', selfRoute)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
export { app, crypto };
export default app;
