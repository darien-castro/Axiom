export interface CanvasUser {
  id: number | string;
  name: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export interface CanvasCourse {
  id: number | string;
  name: string;
  course_code?: string;
  account_id?: number;
  enrollment_term_id?: number;
  start_at?: string;
  end_at?: string;
  term?: {
    id: number;
    name: string;
  };
  enrollments?: CanvasEnrollment[];
  [key: string]: unknown;
}

export interface CanvasAssignment {
  id: number | string;
  course_id: number | string;
  name: string;
  description?: string;
  due_at?: string | null;
  points_possible?: number | null;
  grading_type?: string;
  [key: string]: unknown;
}

export interface CanvasSubmission {
  id: number | string;
  assignment_id: number | string;
  course_id?: number | string;
  user_id?: number | string;
  score?: number | null;
  grade?: string | null;
  submitted_at?: string | null;
  workflow_state?: string;
  [key: string]: unknown;
}

export class CanvasClient {
  public m_baseURL: string;
  public m_apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.m_baseURL = baseURL.replace(/\/+$/, '');
    this.m_apiKey = apiKey;
  }

  async GetRequest<T = any>(apiCall: string): Promise<T> {
    const endpoint = `${this.m_baseURL}${apiCall.startsWith('/') ? '' : '/'}${apiCall}`;
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.m_apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Response Error Status: ${response.status} (${response.statusText})`);
      }

      const result = (await response.json()) as T;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async GetCourses(): Promise<CanvasCourse[]> {
    const apiEndpoint = '/api/v1/courses';
    return this.GetRequest<CanvasCourse[]>(apiEndpoint);
  }

  async GetUserInformation(): Promise<CanvasUser> {
    const apiEndpoint = '/api/v1/users/self';
    return this.GetRequest<CanvasUser>(apiEndpoint);
  }

  async GetCourseData(courseID: string | number): Promise<CanvasCourse> {
    const apiEndpoint = `/api/v1/courses/${courseID}`;
    return this.GetRequest<CanvasCourse>(apiEndpoint);
  }

  async GetCourseGrades(): Promise<CanvasEnrollment[]> {
    const apiEndpoint = '/api/v1/users/self/enrollments';
    return this.GetRequest<CanvasEnrollment[]>(apiEndpoint);
  }

  async GetCourseGrade(courseID: string | number): Promise<CanvasCourse> {
    const apiEndpoint = `/api/v1/courses/${courseID}`;
    return this.GetRequest<CanvasCourse>(apiEndpoint);
  }

  async GetCourseAssignments(courseID: string | number): Promise<CanvasAssignment[]> {
    const apiEndpoint = `/api/v1/courses/${courseID}/assignments`;
    return this.GetRequest<CanvasAssignment[]>(apiEndpoint);
  }

  async GetCourseAssignment(courseID: string | number, assignmentID: string | number): Promise<CanvasAssignment> {
    const apiEndpoint = `/api/v1/courses/${courseID}/assignments/${assignmentID}`;
    return this.GetRequest<CanvasAssignment>(apiEndpoint);
  }

  async GetCourseSubmissions(courseID: string | number): Promise<CanvasSubmission[]> {
    const apiEndpoint = `/api/v1/courses/${courseID}/students/submissions`;
    return this.GetRequest<CanvasSubmission[]>(apiEndpoint);
  }

  async GetSubmissionGrade(courseID: string | number, assignmentID: string | number): Promise<CanvasSubmission> {
    const apiEndpoint = `/api/v1/courses/${courseID}/assignments/${assignmentID}/submissions/self`;
    return this.GetRequest<CanvasSubmission>(apiEndpoint);
  }
}

export { CanvasClient as Canvas_API };
export default CanvasClient;
