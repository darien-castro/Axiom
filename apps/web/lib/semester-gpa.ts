import type { WorkloadCourse } from "./course-workload";

const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const nonGpaGrades = new Set(["I", "IP", "W", "WE", "H", "P", "AU", "N", "NR"]);
const termOrder: Record<string, number> = { spring: 1, summer: 2, fall: 3 };

function academicTerm(term: string) {
  const season = term.match(/\b(spring|summer|fall)\b/i)?.[0].toLowerCase();
  const year = term.match(/\b\d{4}\b/)?.[0];
  if (!season || !year) return null;
  return {
    label: `${season[0].toUpperCase()}${season.slice(1)} ${year}`,
    order: Number(year) * 10 + termOrder[season],
  };
}

function gradeFromPercentage(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function summarizeSemesterGpa(courses: WorkloadCourse[]) {
  let semester: ReturnType<typeof academicTerm> = null;
  for (const course of courses) {
    const term = academicTerm(course.term ?? "");
    if (term && (!semester || term.order > semester.order)) semester = term;
  }
  const semesterCourses = semester
    ? courses.filter((course) => academicTerm(course.term ?? "")?.order === semester.order)
    : courses;

  let gpaHours = 0;
  let totalQualityPoints = 0;
  let missingInputs = 0;
  let usedPercentage = false;
  const rows = semesterCourses.map((course) => {
    const canvasGrade = course.gradeLetter?.trim().toUpperCase();
    const creditHours = course.creditHours;
    const excluded = creditHours === 0 || nonGpaGrades.has(canvasGrade ?? "");
    const letter = canvasGrade?.match(/^([ABCDF])[+-]?$/)?.[1];
    const estimatedLetter = !excluded && !canvasGrade && typeof course.gradeScore === "number" &&
      Number.isFinite(course.gradeScore) && course.gradeScore >= 0
      ? gradeFromPercentage(course.gradeScore)
      : undefined;
    usedPercentage ||= estimatedLetter !== undefined;
    const gpaGrade = letter ?? estimatedLetter;
    let qualityPoints: number | null = null;

    if (!excluded) {
      if (gpaGrade && creditHours !== null && Number.isFinite(creditHours) && creditHours > 0) {
        qualityPoints = gradePoints[gpaGrade] * creditHours;
        totalQualityPoints += qualityPoints;
        gpaHours += creditHours;
      } else {
        missingInputs += 1;
      }
    }

    return { course, gpaGrade, qualityPoints, excluded };
  });

  return {
    term: semester?.label,
    rows,
    gpaHours,
    totalQualityPoints,
    gpa: gpaHours > 0 ? totalQualityPoints / gpaHours : null,
    missingInputs,
    usedPercentage,
  };
}
