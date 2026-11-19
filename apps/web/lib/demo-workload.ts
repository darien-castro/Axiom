import { focusDemoAssignments } from "./focus-demo-data";
import { readFocusIds, writeFocusIds } from "./focus-list";
import { assignmentKey, type FocusAssignment } from "./focus-types";
import { WorkloadRequestError, type canvasWorkload, type DismissedAssignment, type RankableAssignment, type WorkloadCourse } from "./course-workload";

const preferencesKey = "axiom.demo.workload";
const demoNow = Date.parse("2026-11-09T09:00:00-05:00");
export const demoWorkloadLabel = "Demo mode · Sample coursework as of November 9, 2026.";

type DemoPreferences = {
  hiddenCourses?: Record<string, boolean>;
  creditHours?: Record<string, number>;
  dismissed?: Record<string, boolean>;
  timeReports?: Record<string, number>;
};

const demoCourses = new Map<string, Pick<WorkloadCourse, "courseId" | "courseName" | "courseCode">>();
for (const { courseId, courseCode, courseName } of focusDemoAssignments) {
  demoCourses.set(courseId, { courseId, courseCode, courseName });
}
const validFocusIds = new Set(focusDemoAssignments.map(assignmentKey));
let preferences: DemoPreferences = {};
let focusIds: string[] = [];
let preferencesInMemory = false;
let focusInMemory = false;

function readPreferences(): DemoPreferences {
  if (preferencesInMemory) return preferences;
  try {
    preferences = JSON.parse(window.localStorage.getItem(preferencesKey) ?? "{}") ?? {};
  } catch {
    // Keep demo edits usable in memory when browser storage is unavailable.
  }
  return preferences;
}

function writePreferences(value: DemoPreferences) {
  preferences = value;
  try {
    window.localStorage.setItem(preferencesKey, JSON.stringify(value));
  } catch {
    preferencesInMemory = true;
  }
}

function readSavedFocus() {
  if (focusInMemory) return focusIds;
  try {
    focusIds = readFocusIds(window.localStorage, validFocusIds);
  } catch {
    // Use the last in-memory selection.
  }
  return focusIds;
}

export function getDemoAssignment(courseId: string, assignmentId: string) {
  return focusDemoAssignments.find((assignment) => assignment.courseId === courseId && assignment.assignmentId === assignmentId);
}

function requireAssignment(courseId: string, assignmentId: string) {
  const assignment = getDemoAssignment(courseId, assignmentId);
  if (!assignment) throw new Error("Sample assignment could not be found.");
  return assignment;
}

function getCourses(saved: DemoPreferences): WorkloadCourse[] {
  return Array.from(demoCourses.values(), (course) => {
    const credits = saved.creditHours?.[course.courseId];
    return {
      ...course,
      hidden: saved.hiddenCourses?.[course.courseId] === true,
      creditHours: typeof credits === "number" && Number.isFinite(credits) && credits >= 0 ? credits : null,
      term: null,
      gradeScore: null,
      gradeLetter: null,
      canvasUrl: null,
    };
  });
}

function reportedMinutes(assignment: FocusAssignment, saved: DemoPreferences) {
  const minutes = saved.timeReports?.[assignmentKey(assignment)];
  return typeof minutes === "number" && Number.isSafeInteger(minutes) && minutes > 0 ? minutes : undefined;
}

function estimate(assignment: FocusAssignment, minutes?: number) {
  return { estimatedMinutes: minutes ?? assignment.estimatedMinutes, reportCount: minutes === undefined ? 0 : 1 };
}

function dismissedEntry({ courseId, assignmentId, courseName, title }: FocusAssignment): DismissedAssignment {
  return { courseId, assignmentId, courseName, assignmentName: title };
}

async function getAssignments(courseId: string): Promise<{ assignments: RankableAssignment[] }> {
  const saved = readPreferences();
  return { assignments: focusDemoAssignments.filter((assignment) => assignment.courseId === courseId).map((assignment) => ({
    assignmentId: assignment.assignmentId,
    assignmentName: assignment.title,
    availableFrom: null,
    dueAt: assignment.dueAt,
    availableUntil: assignment.availableUntil ?? null,
    lockedForUser: null,
    outstanding: true,
    pointsPossible: assignment.pointsPossible,
    gradeImpactPercent: null,
    submissionGrade: null,
    ...estimate(assignment, reportedMinutes(assignment, saved)),
  })) };
}

export const demoWorkload = {
  now: () => demoNow,
  async getWorkloadCourses() {
    return { courses: getCourses(readPreferences()) };
  },
  async getAssignmentWorkspace() {
    const saved = readPreferences();
    const focused = new Set(readSavedFocus());
    return {
      courses: getCourses(saved),
      focusedAssignments: focusDemoAssignments.filter((assignment) => focused.has(assignmentKey(assignment)))
        .map(({ courseId, assignmentId }) => ({ courseId, assignmentId })),
      dismissedAssignments: focusDemoAssignments.filter((assignment) => saved.dismissed?.[assignmentKey(assignment)] === true).map(dismissedEntry),
      timeReports: focusDemoAssignments.flatMap((assignment) => {
        const minutes = reportedMinutes(assignment, saved);
        return minutes === undefined ? [] : [{ courseId: assignment.courseId, assignmentId: assignment.assignmentId, minutes }];
      }),
    };
  },
  getWorkloadAssignments: getAssignments,
  getRankableAssignments: getAssignments,
  async saveWorkloadCredits(courseId, creditHours) {
    const saved = readPreferences();
    writePreferences({ ...saved, creditHours: { ...saved.creditHours, [courseId]: creditHours } });
    return { creditHours };
  },
  async saveCourseVisibility(courseId, hidden) {
    const saved = readPreferences();
    writePreferences({ ...saved, hiddenCourses: { ...saved.hiddenCourses, [courseId]: hidden } });
    return { hidden };
  },
  async saveAssignmentDismissal(courseId, assignmentId, dismissed) {
    const assignment = requireAssignment(courseId, assignmentId);
    const saved = readPreferences();
    writePreferences({ ...saved, dismissed: { ...saved.dismissed, [assignmentKey(assignment)]: dismissed } });
    return { dismissedAssignment: dismissed ? dismissedEntry(assignment) : null };
  },
  async saveAssignmentFocus(courseId, assignmentId, focused) {
    const id = assignmentKey(requireAssignment(courseId, assignmentId));
    const saved = new Set(readSavedFocus());
    if (focused) saved.add(id);
    else saved.delete(id);
    focusIds = [...saved];
    try {
      writeFocusIds(window.localStorage, focusIds);
      focusInMemory = false;
    } catch {
      focusInMemory = true;
    }
    return { focused };
  },
  async saveWorkloadMinutes(courseId, assignmentId, minutes) {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 2_147_483_647) {
      throw new WorkloadRequestError(400, "Enter a valid number of minutes.");
    }
    const assignment = requireAssignment(courseId, assignmentId);
    const saved = readPreferences();
    writePreferences({ ...saved, timeReports: { ...saved.timeReports, [assignmentKey(assignment)]: minutes } });
    return estimate(assignment, minutes);
  },
  async removeWorkloadMinutes(courseId, assignmentId) {
    const assignment = requireAssignment(courseId, assignmentId);
    const saved = readPreferences();
    const timeReports = { ...saved.timeReports };
    delete timeReports[assignmentKey(assignment)];
    writePreferences({ ...saved, timeReports });
    return estimate(assignment);
  },
} satisfies typeof canvasWorkload;
