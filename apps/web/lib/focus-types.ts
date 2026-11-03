// UI-facing assignment contract; Canvas data can be adapted to it later.
export type DemoImportance = "high" | "medium" | "low";

export interface FocusAssignment {
  courseId: string;
  assignmentId: string;
  title: string;
  courseCode: string;
  courseName: string;
  type: string;
  dueAt: string;
  availableUntil?: string;
  pointsPossible: number;
  estimatedMinutes: number;
  demoImportance: DemoImportance;
}

export function assignmentKey(assignment: FocusAssignment): string {
  return `${assignment.courseId}:${assignment.assignmentId}`;
}
