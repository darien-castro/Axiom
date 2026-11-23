import type { RankableAssignment, WorkloadAssignment, WorkloadCourse } from "./course-workload";

export type AssignmentView = "for-you" | "deadline" | "grade-weight" | "effort";
export type CourseAssignment = RankableAssignment & { course: WorkloadCourse };

export function assignmentDeadline(assignment: WorkloadAssignment) {
  const due = assignment.dueAt ? Date.parse(assignment.dueAt) : NaN;
  if (Number.isFinite(due)) return { date: assignment.dueAt, timestamp: due, label: "Due" };
  const closes = assignment.availableUntil ? Date.parse(assignment.availableUntil) : NaN;
  return Number.isFinite(closes) ? { date: assignment.availableUntil, timestamp: closes, label: "Closes" }
    : { date: null, timestamp: Infinity, label: "" };
}

export function assignmentDay(timestamp: number): number {
  return new Date(timestamp).setHours(0, 0, 0, 0);
}

export function groupAssignmentsByDay(assignments: CourseAssignment[]) {
  const groups = new Map<number | null, CourseAssignment[]>();
  for (const assignment of assignments) {
    const { timestamp } = assignmentDeadline(assignment);
    const day = Number.isFinite(timestamp) ? assignmentDay(timestamp) : null;
    const group = groups.get(day);
    if (group) group.push(assignment);
    else groups.set(day, [assignment]);
  }
  return groups;
}

export function isClosed(assignment: WorkloadAssignment, now: number): boolean {
  return Boolean(assignment.availableUntil && Date.parse(assignment.availableUntil) <= now);
}

const millisecondsPerDay = 86_400_000;

export function baseAssignmentPriority(assignment: RankableAssignment, now: number): number {
  const points = Math.max(0, assignment.pointsPossible ?? 0);
  const effort = Math.max(0, assignment.estimatedMinutes ?? 0) * 60_000;
  const deadline = assignmentDeadline(assignment).timestamp;
  const startLeadDays = Math.max(0, deadline - now - effort) / millisecondsPerDay;
  const urgency = 1 / (1 + startLeadDays);
  return 0.65 * urgency + 0.3 * points / (points + 50) + 0.05 * effort / (effort + 3_600_000);
}

function gradeNeedsBoost(assignment: CourseAssignment): number {
  const { gradeScore } = assignment.course;
  if (gradeScore == null || !Number.isFinite(gradeScore) || assignment.gradeImpactPercent == null) return 0;
  const gradeGap = Math.max(0, Math.min(100, 100 - gradeScore)) / 100;
  return 0.2 * gradeGap * Math.min(1, assignment.gradeImpactPercent / 20);
}

export function sortAssignments(assignments: CourseAssignment[], view: AssignmentView, now: number): CourseAssignment[] {
  const priority = (assignment: CourseAssignment) => baseAssignmentPriority(assignment, now) + gradeNeedsBoost(assignment);
  return [...assignments].sort((a, b) => {
    let order = 0;
    if (view === "for-you") order = Number(Boolean(a.lockedForUser)) - Number(Boolean(b.lockedForUser)) || priority(b) - priority(a);
    if (view === "grade-weight") order = (b.gradeImpactPercent ?? -Infinity) - (a.gradeImpactPercent ?? -Infinity);
    if (view === "effort") order = (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity);
    return order || assignmentDeadline(a).timestamp - assignmentDeadline(b).timestamp ||
      a.assignmentName.localeCompare(b.assignmentName) || a.course.courseId.localeCompare(b.course.courseId) ||
      a.assignmentId.localeCompare(b.assignmentId);
  });
}
