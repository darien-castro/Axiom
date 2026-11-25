
export interface WorkloadCourse {
  courseId: string;
  courseName: string;
  courseCode: string | null;
  term: string | null;
  gradeScore: number | null;
  gradeLetter: string | null;
  creditHours: number | null;
  hidden: boolean;
  canvasUrl: string | null;
}

export type GpaTranscriptTotals = {
  semesterKey: string;
  gpaHours: number;
  qualityPoints: number;
};

export type GpaSetup = {
  credits: { courseId: string; creditHours: number }[];
  transcript?: GpaTranscriptTotals;
};

export interface TimeEstimate {
  estimatedMinutes: number | null;
  reportCount: number;
}

export interface WorkloadAssignment extends TimeEstimate {
  assignmentId: string;
  assignmentName: string;
  availableFrom: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  availableUntil: string | null;
  lockedForUser: boolean | null;
  outstanding: boolean;
}

export interface RankableAssignment extends WorkloadAssignment {
  pointsPossible: number | null;
  gradeImpactPercent: number | null;
  gradeProjection: { gradeAtZero: number; percentPerPoint: number } | null;
  submissionGrade: { label: string | null; score: number | null } | null;
}

export interface DismissedAssignment {
  courseId: string;
  assignmentId: string;
  courseName: string;
  assignmentName: string;
}

export interface PersonalTimeReport {
  courseId: string;
  assignmentId: string;
  minutes: number;
}

export function assignmentIdentity(courseId: string, assignmentId: string) {
  return JSON.stringify([courseId, assignmentId]);
}

export class WorkloadRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, credentials: "include" });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new WorkloadRequestError(response.status, data?.error || "Could not reach Axiom.");
  }
  return response.json();
}

export function getWorkloadCourses(signal: AbortSignal) {
  return request<{ courses: WorkloadCourse[] }>("/workload/courses", { signal });
}

export function getGradeOutlook(id: string, signal: AbortSignal) {
  return request<import("./grade-outlook").Outlook | { reason: string }>(`/workload/courses/${encodeURIComponent(id)}/outlook`, { signal });
}

export function getGpaCourses(signal: AbortSignal) {
  return request<{ courses: WorkloadCourse[]; gpaTranscript: GpaTranscriptTotals | null }>(
    "/workload/courses?includeGpaTranscript=true", { signal },
  );
}

export function getAssignmentWorkspace(signal: AbortSignal) {
  return request<{
    courses: WorkloadCourse[];
    dismissedAssignments: DismissedAssignment[];
    timeReports: PersonalTimeReport[];
    focusedAssignments: { courseId: string; assignmentId: string }[];
  }>(
    "/workload/courses?includeAssignmentPreferences=true", { signal },
  );
}

export function getWorkloadAssignments(courseId: string, signal: AbortSignal) {
  return request<{ assignments: WorkloadAssignment[] }>(`/courses/${encodeURIComponent(courseId)}/assignments/availability`, { signal });
}

export function getRankableAssignments(courseId: string, signal: AbortSignal) {
  return request<{ assignments: RankableAssignment[] }>(`/courses/${encodeURIComponent(courseId)}/assignments/availability?gradeImpact=true`, { signal });
}

function put<T>(path: string, body: object) {
  return request<T>(path, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

export function saveWorkloadCredits(courseId: string, creditHours: number) {
  return put<{ creditHours: number }>(`/workload/courses/${encodeURIComponent(courseId)}/credits`, { creditHours });
}

export function saveGpaSetup(setup: GpaSetup) {
  return put<GpaSetup>("/workload/gpa-setup", setup);
}

export function saveCourseVisibility(courseId: string, hidden: boolean) {
  return put<{ hidden: boolean }>(`/workload/courses/${encodeURIComponent(courseId)}/visibility`, { hidden });
}

export function saveAssignmentDismissal(courseId: string, assignmentId: string, dismissed: boolean) {
  return put<{ dismissedAssignment: DismissedAssignment | null }>("/workload/assignments/dismissal", { courseId, assignmentId, dismissed });
}

export function saveAssignmentFocus(courseId: string, assignmentId: string, focused: boolean) {
  return put<{ focused: boolean }>("/workload/assignments/focus", { courseId, assignmentId, focused });
}

export function saveWorkloadMinutes(courseId: string, assignmentId: string, minutes: number) {
  return put<TimeEstimate>(`/workload/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}/time`, { minutes });
}

export function removeWorkloadMinutes(courseId: string, assignmentId: string) {
  return request<TimeEstimate>(`/workload/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}/time`, { method: "DELETE" });
}

export const canvasWorkload = {
  now: Date.now,
  getWorkloadCourses,
  getAssignmentWorkspace,
  getWorkloadAssignments,
  getRankableAssignments,
  saveWorkloadCredits,
  saveCourseVisibility,
  saveAssignmentDismissal,
  saveAssignmentFocus,
  saveWorkloadMinutes,
  removeWorkloadMinutes,
};

export function dueTime(assignment: WorkloadAssignment): number {
  const time = assignment.dueAt ? Date.parse(assignment.dueAt) : NaN;
  return Number.isFinite(time) ? time : Infinity;
}

export function summarizeWorkload(assignments: WorkloadAssignment[], now: number) {
  const day = 24 * 60 * 60 * 1000;
  const nextMonday = new Date(now);
  nextMonday.setHours(0, 0, 0, 0);
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));

  const upcoming = assignments.filter((assignment) =>
    assignment.outstanding && dueTime(assignment) >= now && dueTime(assignment) < Infinity &&
    (!assignment.availableUntil || Date.parse(assignment.availableUntil) > now),
  ).sort((a, b) => dueTime(a) - dueTime(b));
  const dueSoon = upcoming.filter((assignment) => dueTime(assignment) < now + 5 * day).length;
  const thisWeek = upcoming.filter((assignment) => dueTime(assignment) < nextMonday.getTime());
  return {
    dueSoon,
    pressure: dueSoon >= 3 ? "Overloaded" : dueSoon === 2 ? "Busy" : "Stable",
    upcoming: upcoming.slice(0, 3),
    week: thisWeek.reduce((total, assignment) => ({
      minutes: total.minutes + (assignment.estimatedMinutes ?? 0),
      estimated: total.estimated + Number(assignment.estimatedMinutes !== null),
      total: total.total + 1,
    }), { minutes: 0, estimated: 0, total: 0 }),
  } as const;
}

export function workloadHoursLabel(week: ReturnType<typeof summarizeWorkload>["week"]): string {
  if (week.total === 0) return "0 hrs";
  if (week.estimated === 0) return "No estimates yet";
  if (week.minutes < 60) return `~${Math.round(week.minutes)} min`;
  return `~${(week.minutes / 60).toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs`;
}

export function formatWorkloadDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

export function assignmentAvailability(assignment: WorkloadAssignment, now: number): string {
  if (!assignment.outstanding) return "Completed or excused";
  if (assignment.availableUntil && Date.parse(assignment.availableUntil) <= now) return "Closed";
  if (assignment.availableFrom && Date.parse(assignment.availableFrom) > now) return `Opens ${formatWorkloadDate(assignment.availableFrom)}`;
  if (assignment.lockedForUser) return "Locked in Canvas";
  if (dueTime(assignment) < now) return "Overdue · still open";
  return assignment.availableUntil ? `Closes ${formatWorkloadDate(assignment.availableUntil)}` : "";
}
