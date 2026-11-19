export const canvasBaseUrl = 'https://instructure.charlotte.edu';

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

export interface CanvasEnrollment {
  type?: string;
  user_id?: string | number;
  enrollment_state?: string;
  computed_current_score?: number | null;
  computed_current_grade?: string | null;
  [key: string]: unknown;
}

export interface CanvasAssignment {
  id: number | string;
  course_id: number | string;
  name: string;
  description?: string;
  due_at?: string | null;
  unlock_at?: string | null;
  lock_at?: string | null;
  locked_for_user?: boolean;
  submission?: CanvasSubmission | null;
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
  excused?: boolean;
  missing?: boolean;
  redo_request?: boolean;
  [key: string]: unknown;
}

export class CanvasRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export class CanvasClient {
  public m_baseURL: string;
  public m_apiKey: string;

  constructor(baseURL: string, apiKey = '') {
    this.m_baseURL = baseURL.replace(/\/+$/, '');
    this.m_apiKey = apiKey;
  }
  async verifyKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey === '') { return false; }
    try {
      const response = await fetch(`${this.m_baseURL}/api/v1/users/self`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        }
      })
      if (response.status === 200) {
        this.m_apiKey = apiKey;
        return true;
      }
      return false;
    }
    catch (error) {
      return false;
    }
  }
  async GetRequest<T = any>(apiCall: string): Promise<T> {
    const endpoint = `${this.m_baseURL}${apiCall.startsWith('/') ? '' : '/'}${apiCall}`;
    const response = await this.request(endpoint, this.m_apiKey);
    return (await response.json()) as T;
  }

  private async request(endpoint: string, apiKey: string): Promise<Response> {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error body');
      throw new CanvasRequestError(response.status, `Response Error Status: ${response.status} (${response.statusText}), at ${endpoint}: ${errorBody}`);
    }
    return response;
  }

  async GetCourses(): Promise<CanvasCourse[]> {
    const apiEndpoint = '/api/v1/courses?include[]=total_scores';
    return this.GetRequest<CanvasCourse[]>(apiEndpoint);
  }

  async GetActiveStudentCourses(): Promise<CanvasCourse[]> {
    return this.getAllPages<CanvasCourse>('/api/v1/courses?enrollment_state=active&enrollment_type=student&include[]=total_scores&include[]=term&per_page=100');
  }

  async GetUserInformation(): Promise<CanvasUser> {
    const apiEndpoint = '/api/v1/users/self';
    return this.GetRequest<CanvasUser>(apiEndpoint);
  }

  async GetCourseData(courseID: string | number): Promise<CanvasCourse> {
    const apiEndpoint = `/api/v1/courses/${courseID}?include[]=total_scores`;
    return this.GetRequest<CanvasCourse>(apiEndpoint);
  }

  // causing problems on branch
  /*
  async GetCourseGrades(): Promise<CanvasEnrollment[]> {
    const apiEndpoint = '/api/v1/users/self/enrollments';
    return this.GetRequest<CanvasEnrollment[]>(apiEndpoint);
  }
  */
  async GetCourseGrade(courseID: string | number): Promise<CanvasCourse> {
    const apiEndpoint = `/api/v1/courses/${courseID}`;
    return this.GetRequest<CanvasCourse>(apiEndpoint);
  }

  async GetCourseAssignments(courseID: string | number, includeSubmission = false): Promise<CanvasAssignment[]> {
    const submission = includeSubmission ? '&include[]=submission' : '';
    return this.getAllPages<CanvasAssignment>(`/api/v1/courses/${encodeURIComponent(courseID)}/assignments?per_page=100${submission}`);
  }

  private async getAllPages<T>(path: string): Promise<T[]> {
    const apiKey = this.m_apiKey;
    const canvasOrigin = new URL(this.m_baseURL).origin;
    const items: T[] = [];
    const visited = new Set<string>();
    let nextPage: string | undefined = `${this.m_baseURL}${path}`;

    while (nextPage) {
      const page = new URL(nextPage);
      if (page.origin !== canvasOrigin || visited.has(page.href)) {
        throw new Error('Invalid Canvas pagination link');
      }
      visited.add(page.href);
      const response = await this.request(page.href, apiKey);
      items.push(...(await response.json() as T[]));
      nextPage = response.headers.get('link')?.match(/(?:^|,)\s*<([^>]+)>\s*;\s*rel="next"/i)?.[1];
    }

    return items;
  }

  async GetCourseAssignment(courseID: string | number, assignmentID: string | number): Promise<CanvasAssignment> {
    const apiEndpoint = `/api/v1/courses/${encodeURIComponent(courseID)}/assignments/${encodeURIComponent(assignmentID)}`;
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
