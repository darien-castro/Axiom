import type { CanvasAssignment, CanvasAssignmentGroup, CanvasCourse } from '../client/canvasclient';

function countsTowardsGrade(assignment: CanvasAssignment): boolean {
  return !assignment.omit_from_final_grade && assignment.grading_type !== 'not_graded' &&
    !assignment.submission?.excused && assignment.submission?.assignment_visible !== false;
}

function hasDropRule(group: CanvasAssignmentGroup): boolean {
  return (group.rules?.drop_lowest ?? 0) > 0 || (group.rules?.drop_highest ?? 0) > 0;
}

// Missing points leave the denominator unknown. Zero points may represent extra credit.
function totalPoints(assignments: CanvasAssignment[]): number {
  return assignments.reduce((sum, { points_possible: points }) =>
    sum + (typeof points === 'number' && points >= 0 ? points : NaN), 0);
}

export function calculateGradeImpact(course: CanvasCourse, groups: CanvasAssignmentGroup[], assignments: CanvasAssignment[]) {
  const impact = new Map<string, number>();
  if (course.hide_final_grades || course.grading_periods?.length ||
      course.enrollments?.some((enrollment) => enrollment.multiple_grading_periods_enabled)) return impact;

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
