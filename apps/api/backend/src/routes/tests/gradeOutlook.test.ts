import { expect, it } from 'vitest';
import { buildGradeOutlook } from '../../services/assignmentGradeImpact';
import { simulate } from '../../../../../web/lib/grade-outlook';

const course = { id: 1, name: 'Example', apply_assignment_group_weights: true };
const groups = [{ id: 1, group_weight: 60 }, { id: 2, group_weight: 40 }];
const assignment = { id: 'exam', course_id: 1, name: 'Exam', assignment_group_id: 2, points_possible: 100 };
const graded = { ...assignment, id: 'quiz', assignment_group_id: 1, points_possible: 10, submission: { id: 1, assignment_id: 'quiz', score: 8 } };

it('keeps posted scores fixed and uses final group weights for remaining work', () => {
  const model = buildGradeOutlook(course, groups, [graded, assignment]);
  if (!model.remaining) throw Error(model.reason);
  expect(model.fixed).toBe(48);
  expect(model.remaining[0].share).toBe(0.4);
  const result = simulate(model, 80, 'exam', 80, [75,75]);
  expect(result.low).toBe(78);
  expect(result.chance).toBe(0);
  expect(result.scenario).toBe(100);
});

it('uses the points denominator and excludes excused work', () => {
  const model = buildGradeOutlook({ ...course, apply_assignment_group_weights: false }, [], [
    graded, assignment, { ...assignment, submission: { id: 2, assignment_id: 2, excused: true } },
  ]);
  expect(model.fixed).toBeCloseTo(800 / 110);
  expect(model.remaining).toHaveLength(1);
});

it('withholds estimates for drop rules or unknown points', () => {
  expect(buildGradeOutlook(course, [{ ...groups[0], rules: { drop_lowest: 1 } }], [graded]).reason).toBeTruthy();
  expect(buildGradeOutlook(course, groups, [{ ...assignment, points_possible: null }]).reason).toBeTruthy();
});
