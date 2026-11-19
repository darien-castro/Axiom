"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import CourseVisibilityControls from "@/components/custom/CourseVisibilityControls";
import {
  assignmentAvailability, formatWorkloadDate, getWorkloadAssignments, getWorkloadCourses,
  saveWorkloadCredits, summarizeWorkload, workloadHoursLabel, WorkloadRequestError,
  type WorkloadAssignment, type WorkloadCourse,
} from "@/lib/course-workload";
import styles from "./workload.module.css";

type CourseRow = WorkloadCourse & { assignments: WorkloadAssignment[] | null };
type PageState = { status: "loading" | "signed-out" | "error" } | { status: "ready"; courses: CourseRow[]; now: number };

const pressureLabels = ["Stable", "Busy", "Overloaded"] as const;
const pressureClasses = { Stable: styles.stable, Busy: styles.busy, Overloaded: styles.overloaded, Unknown: styles.unknown };

export default function CoursesPage() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [selection, setSelection] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const { courses } = await getWorkloadCourses(controller.signal);
        const results = await Promise.allSettled(courses.map((course) => getWorkloadAssignments(course.courseId, controller.signal)));
        if (controller.signal.aborted) return;
        setState({ status: "ready", now: Date.now(), courses: courses.map((course, index) => {
          const result = results[index];
          return { ...course, assignments: result.status === "fulfilled" ? result.value.assignments : null };
        }) });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ status: error instanceof WorkloadRequestError && error.status === 401 ? "signed-out" : "error" });
      }
    }

    void load();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  function updateCredits(courseId: string, creditHours: number) {
    setState((previous) => previous.status === "ready" ? {
      ...previous,
      courses: previous.courses.map((course) => course.courseId === courseId ? { ...course, creditHours } : course),
    } : previous);
  }

  function updateVisibility(courseId: string, hidden: boolean) {
    setState((previous) => previous.status === "ready" ? {
      ...previous,
      courses: previous.courses.map((course) => course.courseId === courseId ? { ...course, hidden } : course),
    } : previous);
    if (hidden) setSelection((current) => current === courseId ? undefined : current);
  }

  function selectCourse(courseId: string) {
    setSelection(courseId);
    if (window.matchMedia("(width < 72rem)").matches) {
      const detail = document.getElementById("course-detail");
      detail?.focus({ preventScroll: true });
      detail?.scrollIntoView({ block: "start" });
    }
  }

  const courses = state.status === "ready" ? state.courses : [];
  const now = state.status === "ready" ? state.now : 0;
  const rows = courses.map((course) => ({ ...course, summary: course.assignments && summarizeWorkload(course.assignments, now) }));
  const visibleRows = rows.filter((course) => !course.hidden);
  const hiddenCount = rows.length - visibleRows.length;
  const selected = visibleRows.find((course) => course.courseId === selection)
    ?? visibleRows.reduce<(typeof rows)[number] | undefined>((highest, course) =>
      (course.summary?.dueSoon ?? -1) > (highest?.summary?.dueSoon ?? -2) ? course : highest, undefined);
  const week = rows.reduce((total, { summary }) => ({
    minutes: total.minutes + (summary?.week.minutes ?? 0),
    estimated: total.estimated + (summary?.week.estimated ?? 0),
    total: total.total + (summary?.week.total ?? 0),
  }), { minutes: 0, estimated: 0, total: 0 });
  const loadedCount = rows.filter((course) => course.summary !== null).length;
  const creditsEntered = rows.filter((course) => course.creditHours !== null).length;
  const totalCredits = rows.reduce((total, course) => total + (course.creditHours ?? 0), 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Courses</h1>
        </div>
        <ul className={styles.legend} aria-label="Deadline pressure legend">
          {pressureLabels.map((label) => <li key={label} className={pressureClasses[label]}><span />{label}</li>)}
        </ul>
      </header>

      {state.status === "loading" && <div className={styles.notice} role="status">Fetching, please wait...</div>}
      {state.status === "signed-out" && <div className={styles.notice}>
        <h2>Connect Canvas to see your courses</h2>
        <p>Sign in to view your deadlines, credits, and weekly workload.</p>
        <Link href="/" className={styles.action}>Sign in with Canvas</Link>
      </div>}
      {state.status === "error" && <div className={styles.notice} role="alert">
        <h2>Couldn’t load your courses</h2>
        <button type="button" onClick={retry} className={styles.action}>Try again</button>
      </div>}
      {state.status === "ready" && rows.length === 0 && <div className={styles.notice}><h2>No active Canvas courses</h2><p>Your current enrollments will appear here.</p></div>}

      {rows.length > 0 && <>
        <dl className={styles.totals}>
          <div><dt>Credit hours</dt><dd>{creditsEntered ? totalCredits.toLocaleString() : "Not entered"}</dd><small>{creditsEntered} of {rows.length} courses entered</small></div>
          <div><dt>Work remaining this week</dt><dd>{loadedCount ? workloadHoursLabel(week) : "Unavailable"}</dd>
            <small>{loadedCount === rows.length ? `${week.estimated} of ${week.total} assignments have estimates` : `Loaded ${loadedCount} of ${rows.length} courses · ${week.estimated} estimates`}</small></div>
          <div><dt>Courses under pressure</dt><dd>{loadedCount ? rows.filter(({ summary }) => summary && summary.dueSoon >= 2).length : "Unavailable"}</dd>
            <small>{loadedCount === rows.length ? "Two or more deadlines within five days" : `Deadlines loaded for ${loadedCount} of ${rows.length} courses`}</small></div>
        </dl>

        <details className="mb-4 rounded-xl border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Manage course visibility{hiddenCount > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{hiddenCount} hidden</span>}
          </summary>
          <div className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">Hidden courses still count toward your workload totals.</p>
            <CourseVisibilityControls courses={courses} onChange={updateVisibility} />
          </div>
        </details>
      </>}

      {rows.length > 0 && !selected && <div className={styles.notice}>
        <h2>All courses are hidden</h2>
        <p>Show a course in Manage course visibility to bring it back to the map.</p>
      </div>}

      {selected && <>
        <div className={styles.workspace}>
          <section className={styles.map} aria-labelledby="workload-map-title">
            <header><h2 id="workload-map-title">Workload map</h2><p>Bubble size reflects credit hours. Select a course for details.</p></header>
            <div className={styles.bubbles}>
              {visibleRows.map((course) => {
                const isSelected = course.courseId === selected.courseId;
                const size = course.creditHours === null ? 10.75 : Math.min(15, 9 + 2.35 * Math.sqrt(course.creditHours));
                return <button type="button" key={course.courseId} onClick={() => selectCourse(course.courseId)}
                  aria-pressed={isSelected} aria-controls="course-detail"
                  className={`${styles.bubble} ${pressureClasses[course.summary?.pressure ?? "Unknown"]}`}
                  style={{ "--bubble-size": `${size}rem`, "--bubble-ratio": size / 15 } as CSSProperties}>
                  <span className={styles.deadlineChip}>{course.summary ? `${course.summary.dueSoon} due soon` : "Dates unavailable"}</span>
                  {course.courseCode && <span className={styles.code}>{course.courseCode}</span>}
                  <span className={styles.bubbleName}>{course.courseName}</span>
                  <span className={styles.bubbleGrade}>{course.gradeLetter ?? (course.gradeScore === null ? "" : `${course.gradeScore.toFixed(1)}%`)}</span>
                </button>;
              })}
            </div>
          </section>

          <aside id="course-detail" tabIndex={-1} className={`${styles.detail} ${pressureClasses[selected.summary?.pressure ?? "Unknown"]}`} aria-labelledby="course-detail-title">
            <div className={styles.detailHeader}>
              <div aria-live="polite">
                {selected.courseCode && <p className={styles.code}>{selected.courseCode}</p>}
                <h2 id="course-detail-title">{selected.courseName}</h2>
                {selected.term && <p className={styles.muted}>{selected.term}</p>}
              </div>
              <div className={styles.grade} aria-label="Current grade">
                <strong>{selected.gradeLetter ?? (selected.gradeScore === null ? "—" : `${selected.gradeScore.toFixed(1)}%`)}</strong>
                {selected.gradeLetter && selected.gradeScore !== null && <small>{selected.gradeScore.toFixed(1)}%</small>}
              </div>
            </div>
            <div className={styles.detailBody}>
              <a href={selected.canvasUrl} className={styles.canvasLink} target="_blank" rel="noreferrer">Open course in Canvas <span aria-hidden="true">↗</span></a>
              <div className={styles.pressure}>
                <strong>{selected.summary?.pressure ?? "Deadlines unavailable"}</strong>
                {selected.summary ? <p>{selected.summary.dueSoon} {selected.summary.dueSoon === 1 ? "assignment" : "assignments"} due in the next five days.</p>
                  : <button type="button" onClick={retry} className={styles.textLink}>Retry loading assignments</button>}
              </div>
              <dl className={styles.courseMetrics}>
                <div><dt>Credit hours</dt><dd>{selected.creditHours ?? "—"}</dd></div>
                <div><dt>Work this week</dt><dd>{selected.summary ? workloadHoursLabel(selected.summary.week) : "Unavailable"}</dd>
                  {selected.summary && <small>{selected.summary.week.estimated} of {selected.summary.week.total} estimated</small>}</div>
              </dl>
              <CreditEditor key={selected.courseId} course={selected} onSave={updateCredits} />
              <section className={styles.upcoming} aria-labelledby="upcoming-work-title">
                <h3 id="upcoming-work-title">Upcoming work</h3>
                {selected.summary?.upcoming.length ? <ul>{selected.summary.upcoming.map((assignment) => {
                  const availability = assignmentAvailability(assignment, now);
                  return <li key={assignment.assignmentId}>
                    <strong>{assignment.assignmentName}</strong>
                    {assignment.dueAt && <span>Due {formatWorkloadDate(assignment.dueAt)}</span>}
                    {availability && <small>{availability}</small>}
                  </li>;
                })}</ul> : <p>{selected.summary ? "No upcoming deadlines." : "Assignment dates could not be loaded."}</p>}
                <Link className={styles.allAssignments} href={`/site/assignments?course=${encodeURIComponent(selected.courseId)}`}>View all assignments <span aria-hidden="true">→</span></Link>
              </section>
            </div>
          </aside>
        </div>
      </>}
    </div>
  );
}

function CreditEditor({ course, onSave }: { course: WorkloadCourse; onSave: (courseId: string, creditHours: number) => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const creditHours = Number(new FormData(event.currentTarget).get("credits"));
    setSaving(true);
    try {
      const saved = await saveWorkloadCredits(course.courseId, creditHours);
      onSave(course.courseId, saved.creditHours);
      setMessage("Credit hours saved.");
    } catch (error) {
      setMessage(error instanceof WorkloadRequestError ? error.message : "Couldn’t save credit hours. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return <details className={styles.creditEditor}>
    <summary>{course.creditHours === null ? "Add credit hours" : "Edit credit hours"}</summary>
    <form onSubmit={submit}>
      <label>Credit hours <input required name="credits" type="number" min={0} step="any" defaultValue={course.creditHours ?? undefined} /></label>
      <button type="submit" disabled={saving} className={styles.action}>{saving ? "Saving…" : "Save"}</button>
    </form>
    {message && <p role="status">{message}</p>}
  </details>;
}
