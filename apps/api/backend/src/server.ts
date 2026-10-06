import express, { Request, Response } from 'express';
import cors from 'cors';
import { returnAPIKey } from './api-key';
import { CanvasClient, Canvas_API } from './client/canvasclient';
import mapper from './mapper/mapper';
import courseService from './services/courseService';
import engineService from './services/engineService';
import crypto from './crypto/crypto';
import mockClient front './client/mockclient.ts'

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy' });
});

const apiKey: string = returnAPIKey();
const classTest: CanvasClient = new Canvas_API('https://instructure.charlotte.edu', apiKey);

/*
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

  try {
    const courseAssignments = await classTest.GetCourseSubmissions(testCourseCode);
    console.log(courseAssignments);
  } catch (error) {
    console.error('Failed to get course submissions:', error);
  }
}

export async function testService(): Promise<void> {
  try {
    await CanvasClient.getRequest()
 } catch (error) {
    console.error('testService failed:', error);
  }
}
testService();
*/


app.get('/api/mock/courses', (req : Request, res: Response) => {
    const mockCourses = mockClient.getCourses();
    return res.status(200).json(mockCourses);
});



export { app, classTest, crypto };
export default app;
