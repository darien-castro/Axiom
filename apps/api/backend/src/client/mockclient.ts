import {
  CanvasClient,
  CanvasCourse,
  CanvasUser,
  CanvasEnrollment,
  CanvasAssignment,
  CanvasSubmission,
} from './canvasclient';

export class MockCanvasClient extends CanvasClient {
  constructor(baseURL: string = 'https://mock.canvas.instructure.com', apiKey: string = 'mock-key') {
    super(baseURL, apiKey);
  }

  override async GetCourses(): Promise<CanvasCourse[]> {
    return [
      {
        id: 265289,
        name: '202610-Fall 2026-ITCS-3160-001-Database Design',
        course_code: 'ITCS-3160',
        term: { id: 1, name: 'Fall 2026' },
      },
      {
        id: 265290,
        name: '202610-Fall 2026-ITCS-3145-002-Parallel Computing',
        course_code: 'ITCS-3145',
        term: { id: 1, name: 'Fall 2026' },
      },
    ];
  }

  override async GetUserInformation(): Promise<CanvasUser> {
    return {
      id: 999999,
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      primary_email: 'jdoe@charlotte.edu',
    };
  }

  override async GetCourseGrades(): Promise<CanvasEnrollment[]> {
    return [
      {
        course_id: 265289,
        grades: {
          current_score: 94.5,
          current_grade: 'A',
          final_score: 92.0,
          final_grade: 'A',
        },
      },
      {
        course_id: 265290,
        grades: {
          current_score: 88.0,
          current_grade: 'B+',
          final_score: 85.5,
          final_grade: 'B',
        },
      },
    ];
  }

  override async GetCourseAssignments(courseID: string | number): Promise<CanvasAssignment[]> {
    return [
      {
        id: 101,
        course_id: courseID,
        name: 'Homework 1: Relational Algebra',
        grading_type: 'points',
        points_possible: 100,
        due_at: '2026-10-15T23:59:59Z',
      },
      {
        id: 102,
        course_id: courseID,
        name: 'Project Milestone 1',
        grading_type: 'points',
        points_possible: 50,
        due_at: '2026-10-25T23:59:59Z',
      },
    ];
  }

  override async GetCourseSubmissions(courseID: string | number): Promise<CanvasSubmission[]> {
    return [
      {
        id: 201,
        assignment_id: 101,
        course_id: courseID,
        score: 95,
        grade: '95',
        submitted_at: '2026-10-14T18:00:00Z',
        workflow_state: 'graded',
      },
    ];
  }
}

export default MockCanvasClient;
