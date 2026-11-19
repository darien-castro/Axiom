"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowDown01Icon, ArrowUpRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  assignmentDeadline, isClosed, sortAssignments, type AssignmentView, type CourseAssignment,
} from "@/lib/assignment-ranking";
import {
  assignmentAvailability, assignmentIdentity, formatWorkloadDate, getAssignmentWorkspace, getRankableAssignments,
  removeWorkloadMinutes, saveAssignmentDismissal, saveWorkloadMinutes, WorkloadRequestError,
  type DismissedAssignment, type RankableAssignment, type TimeEstimate, type WorkloadCourse,
} from "@/lib/course-workload";
import DismissedAssignments from "./dismissed-assignments";

type AssignmentState =
  | { status: "loading" | "signed-out" | "error" }
  | {
    status: "ready";
    courses: WorkloadCourse[];
    work: Record<string, RankableAssignment[] | null>;
    dismissedAssignments: DismissedAssignment[];
    reportedMinutes: Map<string, number>;
    now: number;
  };

const views = [
  { id: "for-you", label: "For you", description: "Ordered by deadline, points, and effort, with an adjustment for your current grades." },
  { id: "deadline", label: "Due / lock date", description: "Soonest first. The closing date is used when there’s no due date." },
  { id: "grade-weight", label: "Grade weight", description: "Highest estimated share of the final course grade first." },
  { id: "effort", label: "Effort", description: "Shortest reported time first. Work without estimates appears last." },
] as const;

const gradeColors = {
  green: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
  orange: "bg-orange-500/12 text-orange-800 dark:text-orange-200",
  red: "bg-red-500/12 text-red-800 dark:text-red-200",
  neutral: "bg-muted text-foreground",
};

export default function CourseAssignments() {
  const params = useSearchParams();
  const [state, setState] = useState<AssignmentState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<AssignmentView>("for-you");
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [dismissalStatus, setDismissalStatus] = useState("");
  const [dismissalError, setDismissalError] = useState<{ message: string; restoring: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { courses, dismissedAssignments = [], timeReports = [] } = await getAssignmentWorkspace(controller.signal);
        const visibleCourses = courses.filter(({ hidden }) => !hidden);
        const work: Record<string, RankableAssignment[] | null> = {};
        for (let i = 0; i < visibleCourses.length && !controller.signal.aborted; i += 4) {
          await Promise.all(visibleCourses.slice(i, i + 4).map(async ({ courseId }) => {
            try {
              const { assignments } = await getRankableAssignments(courseId, controller.signal);
              work[courseId] = assignments;
            } catch {
              work[courseId] = null;
            }
          }));
        }
        if (!controller.signal.aborted) {
          const reportedMinutes = new Map(timeReports.map(({ courseId, assignmentId, minutes }) =>
            [assignmentIdentity(courseId, assignmentId), minutes],
          ));
          setState({ status: "ready", courses, work, dismissedAssignments, reportedMinutes, now: Date.now() });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ status: error instanceof WorkloadRequestError && error.status === 401 ? "signed-out" : "error" });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  function updateEstimate(courseId: string, assignmentId: string, estimate: TimeEstimate, minutes: number | null) {
    setState((current) => {
      if (current.status !== "ready" || !current.work[courseId]) return current;
      const assignments = current.work[courseId].map((assignment) =>
        assignment.assignmentId === assignmentId ? { ...assignment, ...estimate } : assignment,
      );
      const key = assignmentIdentity(courseId, assignmentId);
      const reportedMinutes = new Map(current.reportedMinutes);
      if (minutes === null) reportedMinutes.delete(key);
      else reportedMinutes.set(key, minutes);
      return { ...current, work: { ...current.work, [courseId]: assignments }, reportedMinutes };
    });
  }

  async function changeDismissal(courseId: string, assignmentId: string, dismissed: boolean) {
    const key = assignmentIdentity(courseId, assignmentId);
    if (saving.has(key)) return;
    setSaving((current) => new Set(current).add(key));
    setDismissalError(null);
    setDismissalStatus("");

    try {
      const { dismissedAssignment } = await saveAssignmentDismissal(courseId, assignmentId, dismissed);
      setState((current) => {
        if (current.status !== "ready") return current;
        const otherAssignments = current.dismissedAssignments.filter((item) => assignmentIdentity(item.courseId, item.assignmentId) !== key);
        return { ...current, dismissedAssignments: dismissedAssignment ? [dismissedAssignment, ...otherAssignments] : otherAssignments };
      });
      setDismissalStatus(dismissed ? "Assignment dismissed." : "Assignment restored.");
    } catch (error) {
      setDismissalError({
        restoring: !dismissed,
        message: error instanceof WorkloadRequestError ? error.message : "Couldn’t update this assignment. Try again.",
      });
    } finally {
      setSaving((current) => {
        const remaining = new Set(current);
        remaining.delete(key);
        return remaining;
      });
    }
  }

  const activeCourses = state.status === "ready" ? state.courses : [];
  const courses = activeCourses.filter(({ hidden }) => !hidden);
  const dismissed = state.status === "ready" ? state.dismissedAssignments : [];
  const dismissedIds = new Set(dismissed.map(({ courseId, assignmentId }) => assignmentIdentity(courseId, assignmentId)));
  const requestedCourses = params.getAll("course");
  const selectedCourses = new Set(courses.filter(({ courseId }) =>
    !requestedCourses.length || requestedCourses.includes(courseId),
  ).map(({ courseId }) => courseId));

  function changeCourseFilter(ids: Set<string>) {
    const url = new URL(window.location.href);
    url.searchParams.delete("course");
    if (ids.size === 0) url.searchParams.set("course", "");
    else if (ids.size !== courses.length) ids.forEach((id) => url.searchParams.append("course", id));
    window.history.replaceState(null, "", url);
  }

  const now = state.status === "ready" ? state.now : 0;
  const filteredCourses = courses.filter(({ courseId }) => selectedCourses.has(courseId));
  const assignments = state.status === "ready" ? filteredCourses.flatMap((course) =>
    (state.work[course.courseId] ?? [])
      .filter(({ assignmentId }) => !dismissedIds.has(assignmentIdentity(course.courseId, assignmentId)))
      .map((assignment) => ({ ...assignment, course })),
  ) : [];
  const failedCourses = state.status === "ready" && filteredCourses.filter(({ courseId }) => state.work[courseId] === null).length;
  const outstanding = sortAssignments(assignments.filter((assignment) => assignment.outstanding && !isClosed(assignment, now)), view, now);
  const archived = sortAssignments(assignments.filter((assignment) => !assignment.outstanding || isClosed(assignment, now)), view, now);
  const dismissedDialog = <DismissedAssignments assignments={dismissed} saving={saving}
    error={dismissalError?.restoring ? dismissalError.message : null}
    onRestore={(courseId, assignmentId) => void changeDismissal(courseId, assignmentId, false)} />;
  const listActions = {
    reportedMinutes: state.status === "ready" ? state.reportedMinutes : new Map<string, number>(),
    saving,
    onEstimate: updateEstimate,
    onDismiss: (courseId: string, assignmentId: string) => void changeDismissal(courseId, assignmentId, true),
  };

  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-9">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Assignments</h1>
      {state.status === "ready" && assignments.length > 0 && <p className="text-sm text-muted-foreground">{outstanding.length} to do</p>}
      {state.status === "ready" && !courses.length && dismissed.length > 0 && dismissedDialog}
    </header>
    <p role="status" className="sr-only">{dismissalStatus}</p>
    {dismissalError && <p role="alert" className="mb-3 text-sm text-destructive">{dismissalError.message}</p>}

    {state.status === "loading" && <p role="status" className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading Canvas assignments…</p>}
    {state.status === "signed-out" && <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Connect Canvas to see your assignments</h2>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/" className="font-medium underline underline-offset-4">Sign in with Canvas</Link>
        <Link href="/site/assignments?demo=1" className="text-muted-foreground underline underline-offset-4">Try demo assignments</Link>
      </div>
    </div>}
    {state.status === "error" && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-5 text-sm">
      <p role="alert">Couldn’t load your courses.</p>
      <Button type="button" variant="outline" onClick={retry}>Try again</Button>
    </div>}
    {state.status === "ready" && !courses.length && <p className="rounded-xl border border-border bg-card p-5 text-sm">
      {activeCourses.length > 0 ? <>All courses are hidden. <Link href="/site/settings#course-visibility" className="underline underline-offset-4">Edit course visibility</Link></> : "No active Canvas courses."}
    </p>}

    {courses.length > 0 && <Tabs.Root value={view} onValueChange={(value) => setView(value as AssignmentView)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 sm:p-3">
        <Tabs.List aria-label="Assignment order" className="flex min-w-0 flex-wrap gap-1">
          {views.map(({ id, label }) => <Tabs.Tab key={id} value={id}
            className="rounded-lg px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring data-active:bg-primary/12 data-active:text-foreground sm:text-sm">
            {label}
          </Tabs.Tab>)}
        </Tabs.List>
        <div className="flex items-center gap-2">
          <CourseFilter courses={courses} selected={selectedCourses} onChange={changeCourseFilter} />
          {dismissedDialog}
        </div>
      </div>

      {views.map(({ id, description }) => <Tabs.Panel key={id} value={id} className="mt-4 outline-none">
        {id === view && <>
          <p className="mb-3 text-xs text-muted-foreground">{description}</p>
          {Boolean(failedCourses) && <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
            <p role="alert">Work couldn’t be loaded for {failedCourses} {failedCourses === 1 ? "course" : "courses"}.</p>
            <Button type="button" variant="outline" disabled={saving.size > 0} onClick={retry}>Retry</Button>
          </div>}
          {outstanding.length ? <AssignmentList assignments={outstanding} now={now} {...listActions} />
            : <p className="rounded-xl border border-border bg-card p-5 text-sm">
              {!filteredCourses.length ? "Select courses to see their assignments." : "No outstanding assignments in these courses."}
            </p>}
          {archived.length > 0 && <details className="mt-4 rounded-xl border border-border bg-card">
            <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-medium">Completed and closed <span className="ml-1 text-xs text-muted-foreground">{archived.length}</span></summary>
            <AssignmentList assignments={archived} now={now} {...listActions} />
          </details>}
        </>}
      </Tabs.Panel>)}
    </Tabs.Root>}
  </div>;
}

function CourseFilter({ courses, selected, onChange }: {
  courses: WorkloadCourse[];
  selected: Set<string>;
  onChange: (ids: Set<string>) => void;
}) {
  const all = selected.size === courses.length;
  return <Menu.Root>
    <Menu.Trigger render={<Button variant="outline" size="lg" className="h-9 gap-2" />}>
      {all ? "All courses" : selected.size + (selected.size === 1 ? " course" : " courses")}
      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className="size-4 text-muted-foreground" />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner align="end" sideOffset={6} className="z-50">
        <Menu.Popup aria-label="Filter by course" className="max-h-[min(20rem,var(--available-height))] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
          <Menu.CheckboxItem checked={all} onCheckedChange={(checked) => onChange(new Set(checked ? courses.map(({ courseId }) => courseId) : []))}
            className="flex cursor-default items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium outline-none data-highlighted:bg-muted">
            <CourseCheckmark />All courses
          </Menu.CheckboxItem>
          <Menu.Separator className="my-1 h-px bg-border" />
          {courses.map((course) => <Menu.CheckboxItem key={course.courseId} checked={selected.has(course.courseId)} onCheckedChange={(checked) => {
            const ids = new Set(selected);
            if (checked) ids.add(course.courseId);
            else ids.delete(course.courseId);
            onChange(ids);
          }} className="flex cursor-default items-start gap-2 rounded-lg px-2 py-2 text-sm outline-none data-highlighted:bg-muted">
            <CourseCheckmark />
            <span className="min-w-0 wrap-anywhere">{course.courseName}</span>
          </Menu.CheckboxItem>)}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>;
}

function CourseCheckmark() {
  return <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border border-border">
    <Menu.CheckboxItemIndicator render={<HugeiconsIcon icon={Tick02Icon} aria-hidden="true" className="size-3" />} />
  </span>;
}

type AssignmentActions = {
  onEstimate: (courseId: string, assignmentId: string, estimate: TimeEstimate, minutes: number | null) => void;
  onDismiss: (courseId: string, assignmentId: string) => void;
};

function AssignmentList({ assignments, now, reportedMinutes, saving, onEstimate, onDismiss }: AssignmentActions & {
  assignments: CourseAssignment[];
  now: number;
  reportedMinutes: ReadonlyMap<string, number>;
  saving: ReadonlySet<string>;
}) {
  return <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
    {assignments.map((assignment) => {
      const key = assignmentIdentity(assignment.course.courseId, assignment.assignmentId);
      return <AssignmentRow key={key} assignment={assignment} now={now} reportedMinutes={reportedMinutes.get(key)}
        dismissing={saving.has(key)} onEstimate={onEstimate} onDismiss={onDismiss} />;
    })}
  </ul>;
}

function AssignmentRow({ assignment, now, reportedMinutes, dismissing, onEstimate, onDismiss }: AssignmentActions & {
  assignment: CourseAssignment;
  now: number;
  reportedMinutes?: number;
  dismissing: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [effortAction, setEffortAction] = useState<"saving" | "removing" | null>(null);
  const [message, setMessage] = useState("");
  const { course, assignmentId } = assignment;
  const deadline = assignmentDeadline(assignment);
  const availability = assignmentAvailability(assignment, now);
  const status = availability.startsWith("Closes") ? "" : availability;
  const grade = !assignment.outstanding ? assignmentGradeBadge(assignment) : null;
  const weight = assignment.gradeImpactPercent == null ? "Unavailable" :
    assignment.gradeImpactPercent.toLocaleString(undefined, { maximumFractionDigits: 2 }) + "%";
  const effort = assignment.estimatedMinutes == null ? "No estimate" : formatEffort(assignment.estimatedMinutes);

  async function reportTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(new FormData(event.currentTarget).get("minutes"));
    await saveEffort(minutes);
  }

  async function saveEffort(minutes: number | null) {
    setEffortAction(minutes === null ? "removing" : "saving");
    setMessage("");
    try {
      const estimate = minutes === null ? await removeWorkloadMinutes(course.courseId, assignmentId)
        : await saveWorkloadMinutes(course.courseId, assignmentId, minutes);
      onEstimate(course.courseId, assignmentId, estimate, minutes);
      setMessage(minutes === null ? "Time report removed." : "Time report saved.");
    } catch (error) {
      setMessage(error instanceof WorkloadRequestError ? error.message : "Couldn’t update your time report. Try again.");
    } finally {
      setEffortAction(null);
    }
  }

  const dismiss = useCallback(() => {
    if (dismissing) return;
    setMenuOpen(false);
    onDismiss(course.courseId, assignmentId);
  }, [assignmentId, course.courseId, dismissing, onDismiss]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "d" || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    }

    window.addEventListener("keydown", handleShortcut, true);
    return () => window.removeEventListener("keydown", handleShortcut, true);
  }, [dismiss, menuOpen]);

  function openMenuFromKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
    event.preventDefault();
    const row = event.currentTarget;
    const { left, top } = row.getBoundingClientRect();
    row.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true, cancelable: true, button: 2, clientX: left + 12, clientY: top + 12,
    }));
  }

  return <ContextMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
    <ContextMenu.Trigger render={<li className="px-4 py-4 sm:px-5" />} onKeyDown={openMenuFromKeyboard}>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-center">
        <div className="min-w-0">
          <p className="mb-0.5 text-xs text-muted-foreground">{course.courseCode || course.courseName}</p>
          <a className="inline-flex items-center gap-1.5 wrap-anywhere font-semibold hover:underline underline-offset-4"
            target="_blank" rel="noreferrer" href={course.canvasUrl + "/assignments/" + encodeURIComponent(assignmentId)}>
            {assignment.assignmentName}
            <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          </a>
          {status && <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{status}</span>
            {grade && <span className={"rounded-full px-2 py-0.5 font-medium tabular-nums " + gradeColors[grade.color]}>
              Grade {grade.text}
            </span>}
          </p>}
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-[minmax(0,1.65fr)_repeat(2,minmax(0,1fr))]">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-muted-foreground">Deadline</dt>
            <dd className="mt-0.5">{deadline.date ? <time dateTime={deadline.date}>{deadline.label} {formatWorkloadDate(deadline.date)}</time> : "No deadline"}</dd>
          </div>
          <div><dt className="text-xs text-muted-foreground">Grade weight</dt><dd className="mt-0.5">{weight}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Estimated effort</dt><dd className="mt-0.5">{effort}</dd></div>
        </dl>
      </div>
      <details className="mt-2.5 text-xs">
        <summary className="w-fit cursor-pointer font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
          {reportedMinutes === undefined ? "Report time spent" : "Edit reported effort"}
        </summary>
        <form onSubmit={reportTime} className="mt-2.5 flex flex-wrap items-end gap-2">
          <label className="grid gap-1">Minutes spent
            <input key={reportedMinutes ?? "new"} name="minutes" type="number" min="1" step="1" required defaultValue={reportedMinutes}
              className="h-8 w-28 rounded-md border border-border bg-background px-2 text-sm" />
          </label>
          <Button size="lg" variant="outline" type="submit" disabled={effortAction !== null}>{effortAction === "saving" ? "Saving…" : "Save time"}</Button>
          {reportedMinutes !== undefined && <Button size="lg" variant="ghost" type="button" disabled={effortAction !== null}
            onClick={() => void saveEffort(null)} className="text-destructive">
            {effortAction === "removing" ? "Removing…" : "Remove report"}
          </Button>}
        </form>
        {assignment.reportCount > 0 && <p className="mt-2 text-muted-foreground">Estimate based on {assignment.reportCount} {assignment.reportCount === 1 ? "report" : "reports"}.</p>}
        {message && <p role="status" className="mt-1">{message}</p>}
      </details>
    </ContextMenu.Trigger>
    <ContextMenu.Portal>
      <ContextMenu.Positioner className="z-50" sideOffset={4}>
        <ContextMenu.Popup aria-label="Assignment actions" className="min-w-36 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          <ContextMenu.Item aria-keyshortcuts="D" disabled={dismissing} onClick={dismiss}
            className="flex cursor-default items-center justify-between gap-5 rounded-md px-2.5 py-2 text-sm outline-none data-highlighted:bg-muted">
            Dismiss <kbd aria-hidden="true" className="rounded border border-border px-1 text-xs text-muted-foreground">D</kbd>
          </ContextMenu.Item>
        </ContextMenu.Popup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  </ContextMenu.Root>;
}

function formatEffort(minutes: number) {
  if (minutes < 60) return Math.round(minutes) + " min";
  const hours = (minutes / 60).toLocaleString(undefined, { maximumFractionDigits: 1 });
  return hours + (hours === "1" ? " hr" : " hrs");
}

function assignmentGradeBadge({ submissionGrade, pointsPossible }: RankableAssignment) {
  if (!submissionGrade) return null;

  const { label, score } = submissionGrade;
  const numericLabel = label !== null && /^-?\d+(?:\.\d+)?$/.test(label);
  const points = score ?? (numericLabel ? Number(label) : null);
  const possible = pointsPossible ?? 0;
  const text = points !== null && (label === null || numericLabel)
    ? points.toLocaleString() + (possible > 0 ? " / " + possible.toLocaleString() : " pts")
    : label;
  if (!text) return null;

  const category = label?.toUpperCase() ?? "";
  if (/^[AB][+-]?$|^COMPLETE$|^PASS(?:ED)?$/.test(category)) return { text, color: "green" as const };
  if (/^C[+-]?$/.test(category)) return { text, color: "orange" as const };
  if (/^[DF][+-]?$|^INCOMPLETE$|^FAIL(?:ED)?$/.test(category)) return { text, color: "red" as const };

  const percentLabel = category.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
  const percent = percentLabel ? Number(percentLabel[1]) : points !== null && possible > 0 ? points / possible * 100 : null;
  const color = percent === null ? "neutral" : percent >= 80 ? "green" : percent >= 70 ? "orange" : "red";
  return { text, color } as const;
}
