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

export function buildGradeOutlook(course: CanvasCourse, groups: CanvasAssignmentGroup[], assignments: CanvasAssignment[]) {
  if (hasUnavailableCourseGrade(course)) return { reason: 'This course hides grades or uses multiple grading periods.' };
  if (groups.some(hasDropRule)) return { reason: 'This course drops scores. Its grading rules are not supported yet.' };
  const weighted = course.apply_assignment_group_weights;
  const incomplete = { reason: 'Canvas has incomplete points or grading weights for this course.' };
  if (typeof weighted !== 'boolean') return incomplete;
  const items = assignments.filter(a => countsTowardsGrade(a) && a.published !== false);
  const configured = new Map(groups.map(g => [String(g.id), g.group_weight]));
  const totals = new Map<string, { weight: number; points: number; earned: number; history: number[] }>();
  const pending = [];
  for (const a of items) {
    const id = weighted ? String(a.assignment_group_id) : 'course';
    const weight = weighted ? configured.get(id) : 100;
    const points = a.points_possible;
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) return incomplete;
    if (!weight) continue;
    if (typeof points !== 'number' || !Number.isFinite(points) || points < 0) return incomplete;
    const group = totals.get(id) ?? { weight, points: 0, earned: 0, history: [] as number[] };
    totals.set(id, group);
    group.points += points;
    const sub = a.submission;
    const posted = sub?.posted_at !== null && !(a.muted && !sub?.posted_at) && sub?.workflow_state !== 'pending_review';
    const score = posted ? sub?.score : null;
    if (score != null) {
      if (!Number.isFinite(score)) return incomplete;
      group.earned += score;
      if (points > 0) group.history.push(Math.max(0, Math.min(100, 100 * score / points)));
    } else if (points > 0) {
      pending.push({ id: String(a.id), name: a.name, groupId: id, points, actionable: !sub?.submitted_at && !['submitted','graded','pending_review'].includes(sub?.workflow_state ?? '') && !a.locked_for_user && !(a.lock_at && Date.parse(a.lock_at) <= Date.now()) });
    }
  }
  const active = [...totals.values()].filter(g => g.points > 0);
  const totalWeight = Math.min(100, active.reduce((sum, g) => sum + g.weight, 0));
  if (!totalWeight || [...totals.values()].some(g => !g.points && g.earned)) return incomplete;
  const fixed = active.reduce((sum, g) => sum + 100 * g.weight / totalWeight * g.earned / g.points, 0);
  const remaining = pending.map(({ groupId, points, ...assignment }) => {
    const group = totals.get(groupId)!;
    return { ...assignment, groupId, share: group.weight / totalWeight * points / group.points };
  }).sort((a,b) => b.share - a.share);
  return { fixed, remaining, history: Object.fromEntries([...totals].map(([id,g]) => [id,g.history])) };
}
