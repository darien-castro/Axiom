import { assignments, courses } from './demo';

/** Existing Django routes. These constants do not make network requests. */
export const canvasEndpoints = {
  courses: '/api/courses/',
  assignments: '/api/assignments/',
  weeklyAssignments: '/api/assignments/weekly/',
  todo: '/api/todo/',
  assignmentGroups: (courseId: number) => `/api/courses/${courseId}/assignment-groups/`,
} as const;

export type CanvasAssignment = {
  course_id: number; course_title: string; assignment_id: number; title: string;
  due_at: string | null; lock_at: string | null; effective_due_at: string | null;
  date_source: 'due_at' | 'lock_at' | null; url: string | null; group: string;
  group_weight: number | null; weighted: boolean; below_b: boolean | null;
  alert: { symbol: string; message: string } | null;
};

/** Swap this adapter for authenticated Django calls when integration is enabled.
 * Keep Canvas records separate from the demo analytics model: group_weight is
 * category weight, never the individual assignment's grade impact.
 * Ranking, GPA projections, effort, and workload require future services.
 */
export async function getDashboardData() {
  return { courses, assignments, source: 'demo' as const };
}

/** Placeholder only: never accepts, saves, or transmits a real credential. */
export async function connectCanvasDemo() {
  return { source: 'demo' as const };
}
