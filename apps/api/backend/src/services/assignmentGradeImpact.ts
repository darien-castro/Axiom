import type { CanvasAssignment, CanvasAssignmentGroup, CanvasCourse } from '../client/canvasclient';

function countsTowardsGrade(assignment: CanvasAssignment): boolean {
  return !assignment.omit_from_final_grade && assignment.grading_type !== 'not_graded' &&
    !assignment.submission?.excused && assignment.submission?.assignment_visible !== false;
}

function hasDropRule(group: CanvasAssignmentGroup): boolean {
  return (group.rules?.drop_lowest ?? 0) > 0 || (group.rules?.drop_highest ?? 0) > 0;
}

function hasUnavailableCourseGrade(course: CanvasCourse): boolean {
  return Boolean(course.hide_final_grades || course.grading_periods?.length ||
    course.enrollments?.some((enrollment) => enrollment.multiple_grading_periods_enabled));
}

// Missing points leave the denominator unknown. Zero points may represent extra credit.
function totalPoints(assignments: CanvasAssignment[]): number {
  return assignments.reduce((sum, { points_possible: points }) =>
    sum + (typeof points === 'number' && points >= 0 ? points : NaN), 0);
}

export function calculateGradeImpact(course: CanvasCourse, groups: CanvasAssignmentGroup[], assignments: CanvasAssignment[]) {
  const impact = new Map<string, number>();
  if (hasUnavailableCourseGrade(course)) return impact;

  const graded = assignments.filter(countsTowardsGrade);
  function addImpact(items: CanvasAssignment[], weight: number) {
    const points = totalPoints(items);
    if (!Number.isFinite(points) || points <= 0) return;
    for (const assignment of items) {
      if (assignment.points_possible && assignment.points_possible > 0) {
        impact.set(String(assignment.id), weight * (assignment.points_possible / points));
      }
    }
  }

  if (course.apply_assignment_group_weights === false) {
    if (!groups.some(hasDropRule)) addImpact(graded, 100);
  } else if (course.apply_assignment_group_weights === true && graded.every((assignment) => assignment.assignment_group_id != null)) {
    const byGroup = new Map<string, CanvasAssignment[]>();
    for (const assignment of graded) {
      const groupId = String(assignment.assignment_group_id);
      const items = byGroup.get(groupId) ?? [];
      items.push(assignment);
      byGroup.set(groupId, items);
    }
    for (const group of groups) {
      const items = byGroup.get(String(group.id));
      if (items && typeof group.group_weight === 'number' && Number.isFinite(group.group_weight) && group.group_weight >= 0 && !hasDropRule(group)) {
        addImpact(items, group.group_weight);
      }
    }
  }
  return impact;
}

type GradeProjection = { gradeAtZero: number; percentPerPoint: number };
type GroupTotals = { weight: number; earned: number; possible: number };

export function calculateGradeProjections(course: CanvasCourse, groups: CanvasAssignmentGroup[], assignments: CanvasAssignment[]) {
  const projections = new Map<string, GradeProjection>();
  if (hasUnavailableCourseGrade(course) || groups.some(hasDropRule)) return projections;

  const weighted = course.apply_assignment_group_weights;
  if (typeof weighted !== 'boolean') return projections;
  const totals = new Map<string, GroupTotals>();
  if (weighted) {
    for (const group of groups) {
      const weight = group.group_weight;
      if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) return projections;
      totals.set(String(group.id), { weight, earned: 0, possible: 0 });
    }
  } else {
    totals.set('course', { weight: 100, earned: 0, possible: 0 });
  }

  const candidates: { id: string; group: GroupTotals; points: number; score: number | null }[] = [];
  for (const assignment of assignments) {
    if (!countsTowardsGrade(assignment) || assignment.published === false) continue;
    const group = totals.get(weighted ? String(assignment.assignment_group_id) : 'course');
    const points = assignment.points_possible;
    const submission = assignment.submission;
    // Canvas can mark the assignment muted even when this student's score is posted.
    const unposted = submission?.posted_at === null || (assignment.muted === true && !submission?.posted_at);
    const score = !unposted && submission?.workflow_state !== 'pending_review'
      ? submission?.score ?? null : null;
    if (!group) return projections;
    if (typeof points !== 'number' || !Number.isFinite(points) || points < 0) {
      if (score !== null) return projections;
      continue;
    }
    if (score !== null) {
      if (!Number.isFinite(score)) return projections;
      group.earned += score;
      group.possible += points;
    }
    if (points > 0) candidates.push({ id: String(assignment.id), group, points, score });
  }

  const contribution = ({ possible, earned, weight }: GroupTotals) => possible > 0 ? earned / possible * weight : 0;
  let weightedGrade = 0;
  let activeWeight = 0;
  for (const group of totals.values()) {
    if (group.possible <= 0) continue;
    weightedGrade += contribution(group);
    activeWeight += group.weight;
  }

  for (const { id, group, points, score } of candidates) {
    const possible = group.possible + (score === null ? points : 0);
    const weight = Math.min(100, activeWeight + (group.possible === 0 ? group.weight : 0));
    if (weight <= 0) continue;
    const zeroContribution = (group.earned - (score ?? 0)) / possible * group.weight;
    projections.set(id, {
      gradeAtZero: (weightedGrade - contribution(group) + zeroContribution) * 100 / weight,
      percentPerPoint: group.weight / possible * 100 / weight,
    });
  }
  return projections;
}
