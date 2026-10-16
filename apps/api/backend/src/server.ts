import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { CanvasClient, Canvas_API } from './client/canvasclient';
import mapper from './mapper/mapper';
import courseService from './services/courseService';
import engineService from './services/engineService';
import crypto from './crypto/crypto';
import mockClient from './client/mockclient.ts'

const app = express();
const PORT = process.env.PORT || 5000;


// Basic health check route
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy' });
});

const apiKey = process.env.CANVAS_API_KEY;
if (!apiKey) throw new Error('CANVAS_API_KEY is not set');
const classTest: CanvasClient = new Canvas_API('https://instructure.charlotte.edu', apiKey);

export async function printEverything(): Promise<void> {
  console.log("============= Courses ==================");
  const courses = await classTest.GetCourses();
  const cleanCourses = mapper.cleanCourses(courses);
  console.log(cleanCourses);

  console.log("\n\n\n");

  console.log("============= Course Grades ================");
  const courseGrades = await classTest.GetCourseGrades();
  const cleanCourseGrades = mapper.cleanCourseGrades(courseGrades);
  console.log(cleanCourseGrades); 
  console.log("\n\n\n");

  console.log("============= User information ================");
  const userInfo = await classTest.GetUserInformation();
  const cleanUserInfo = mapper.cleanUserInformation(userInfo);
  console.log(cleanUserInfo); 
  const testCourseCode = '265289';

}

export async function testService(): Promise<void> {
  try {
    await CanvasClient.getRequest()
 } catch (error) {
    console.error('testService failed:', error);
  }
}

// printEverything();

// api stuff
//

app.use(cors({ origin: 'http://localhost:3001' })); 

app.get("/", (req, res) => {
    res.send("Hello from Express server!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
export { app, classTest, crypto };
export default app;
