"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowDown01Icon, ArrowUpRight01Icon, Bookmark01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FocusConfirmation from "@/components/custom/focus/FocusConfirmation";
import {
  assignmentDeadline, isClosed, sortAssignments, type AssignmentView, type CourseAssignment,
} from "@/lib/assignment-ranking";
import {
  assignmentAvailability, assignmentIdentity, formatWorkloadDate, getAssignmentWorkspace, getRankableAssignments,
  removeWorkloadMinutes, saveAssignmentDismissal, saveAssignmentFocus, saveWorkloadMinutes, WorkloadRequestError,
  type DismissedAssignment, type RankableAssignment, type TimeEstimate, type WorkloadCourse,
} from "@/lib/course-workload";
import DismissedAssignments from "./dismissed-assignments";

type WorkspaceView = AssignmentView | "semester" | "focus";

type AssignmentState =
  | { status: "loading" | "signed-out" | "error" }
  | {
    status: "ready";
    courses: WorkloadCourse[];
    work: Record<string, RankableAssignment[] | null>;
    dismissedAssignments: DismissedAssignment[];
    focusedIds: Set<string>;
    reportedMinutes: Map<string, number>;
    now: number;
  };

const views = [
  { id: "for-you", label: "For you", description: "Personalized for you based on your current grades, upcoming deadlines, points, and time commitment." },
  { id: "deadline", label: "Due / lock date", description: "Soonest first. The assignment lock date is used when there’s no due date." },
  { id: "grade-weight", label: "Grade weight", description: "Highest estimated share of the final course grade first." },
  { id: "effort", label: "Duration", description: "Shortest reported time first. Work without estimates appears last." },
  { id: "semester", label: "Chronological", description: "Earliest to latest across the semester, including completed and closed work." },
  { id: "focus", label: "My Focus List", description: "Assignments you’ve saved, ordered by deadline." },
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
  const [view, setView] = useState<WorkspaceView>("for-you");
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [dismissalStatus, setDismissalStatus] = useState("");
  const [dismissalError, setDismissalError] = useState<{ message: string; restoring: boolean } | null>(null);
  const [savingFocus, setSavingFocus] = useState<Set<string>>(new Set());
  const [pendingFocus, setPendingFocus] = useState<CourseAssignment | null>(null);
  const [focusStatus, setFocusStatus] = useState("");
  const [focusError, setFocusError] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const focusTab = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { courses, dismissedAssignments = [], timeReports = [], focusedAssignments = [] } = await getAssignmentWorkspace(controller.signal);
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
          const focusedIds = new Set(focusedAssignments.map(({ courseId, assignmentId }) => assignmentIdentity(courseId, assignmentId)));
          setState({ status: "ready", courses, work, dismissedAssignments, focusedIds, reportedMinutes, now: Date.now() });
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

  async function changeFocus(assignment: CourseAssignment, focused: boolean, button?: HTMLButtonElement) {
    const { assignmentId, assignmentName, course } = assignment;
    const key = assignmentIdentity(course.courseId, assignmentId);
    if (savingFocus.has(key)) return;
    setSavingFocus((current) => new Set(current).add(key));
    setFocusError("");
    setFocusStatus("");

    try {
      const saved = await saveAssignmentFocus(course.courseId, assignmentId, focused);
      if (!saved.focused && view === "focus" && button && document.activeElement === button) focusTab.current?.focus();
      setState((current) => {
        if (current.status !== "ready") return current;
        const focusedIds = new Set(current.focusedIds);
        if (saved.focused) focusedIds.add(key);
        else focusedIds.delete(key);
        return { ...current, focusedIds };
      });
      setFocusStatus(assignmentName + (saved.focused ? " added to My Focus List." : " removed from My Focus List."));
    } catch (error) {
      setFocusError(error instanceof WorkloadRequestError ? error.message : "Couldn’t update your Focus List. Try again.");
    } finally {
      setSavingFocus((current) => {
        const remaining = new Set(current);
        remaining.delete(key);
        return remaining;
      });
    }
  }

  const activeCourses = state.status === "ready" ? state.courses : [];
  const courses = activeCourses.filter(({ hidden }) => !hidden);
  const dismissed = state.status === "ready" ? state.dismissedAssignments : [];
  const focusedIds = state.status === "ready" ? state.focusedIds : new Set<string>();
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
  const allAssignments = state.status === "ready" ? courses.flatMap((course) =>
    (state.work[course.courseId] ?? [])
      .filter(({ assignmentId }) => !dismissedIds.has(assignmentIdentity(course.courseId, assignmentId)))
      .map((assignment) => ({ ...assignment, course })),
  ) : [];
  const assignments = allAssignments.filter(({ course }) => selectedCourses.has(course.courseId));
  const isFocused = ({ course, assignmentId }: CourseAssignment) => focusedIds.has(assignmentIdentity(course.courseId, assignmentId));
  const focusCount = allAssignments.filter(isFocused).length;
  const failedCourses = state.status === "ready" && filteredCourses.filter(({ courseId }) => state.work[courseId] === null).length;
  const showWholeList = view === "semester" || view === "focus";
  const order = showWholeList ? "deadline" : view;
  const activeAssignments = view === "focus" ? assignments.filter(isFocused)
    : view === "semester" ? assignments : assignments.filter((assignment) => assignment.outstanding && !isClosed(assignment, now));
  const displayed = sortAssignments(activeAssignments, order, now);
  const archived = showWholeList ? [] : sortAssignments(assignments.filter((assignment) => !assignment.outstanding || isClosed(assignment, now)), order, now);
  const activeView = views.find(({ id }) => id === view);
  const dismissedDialog = <DismissedAssignments assignments={dismissed} saving={saving}
    error={dismissalError?.restoring ? dismissalError.message : null}
    onRestore={(courseId, assignmentId) => void changeDismissal(courseId, assignmentId, false)} />;
  const listActions = {
    reportedMinutes: state.status === "ready" ? state.reportedMinutes : new Map<string, number>(),
    focusedIds,
    savingFocus,
    saving,
    onEstimate: updateEstimate,
    onDismiss: (courseId: string, assignmentId: string) => void changeDismissal(courseId, assignmentId, true),
    onToggleFocus: (assignment: CourseAssignment, button: HTMLButtonElement) => {
      if (isFocused(assignment)) void changeFocus(assignment, false, button);
      else {
        returnFocus.current = button;
        setPendingFocus(assignment);
      }
    },
  };

  return <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:gap-8 md:p-10">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find and prioritize work across your Canvas courses.</p>
      </div>
      {state.status === "ready" && !courses.length && dismissed.length > 0 && dismissedDialog}
    </header>
    <p role="status" className="sr-only">{dismissalStatus}</p>
    <p role="status" className="sr-only">{focusStatus}</p>
    {dismissalError && <p role="alert" className="mb-3 text-sm text-destructive">{dismissalError.message}</p>}
    {focusError && <p role="alert" className="text-sm text-destructive">{focusError}</p>}

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

    {courses.length > 0 && <Tabs.Root value={view} onValueChange={(value) => setView(value as WorkspaceView)}>
      <p className="mb-5 text-xs leading-relaxed text-muted-foreground md:mb-7">{activeView?.description}</p>
      <Tabs.List aria-label="Assignment views" className="flex min-w-0 flex-wrap gap-2 border-b border-border/60 pb-3">
        {views.map(({ id, label }) => <Tabs.Tab key={id} value={id}
          ref={id === "focus" ? focusTab : undefined}
          className="rounded-xl border border-transparent px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring data-active:border-primary/20 data-active:bg-primary/12 data-active:text-foreground sm:h-10 sm:px-4 sm:text-sm">
          {label}
          {id === "focus" && <span className="ml-2 text-xs tabular-nums text-muted-foreground">{focusCount}</span>}
        </Tabs.Tab>)}
      </Tabs.List>

      {views.map(({ id }) => <Tabs.Panel key={id} value={id} className="mt-6 outline-none md:mt-10">
        {id === view && <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5 sm:gap-4">
            <h2 className="text-base font-semibold">
              {view === "focus" ? "My Focus List" : view === "semester" ? "Semester assignments" : "To do"}
              <span className="ml-2 text-xs font-normal text-muted-foreground">{displayed.length} shown</span>
            </h2>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Course</span>
                <CourseFilter courses={courses} selected={selectedCourses} onChange={changeCourseFilter} />
              </div>
              {dismissedDialog}
            </div>
          </div>
          {Boolean(failedCourses) && <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
            <p role="alert">Work couldn’t be loaded for {failedCourses} {failedCourses === 1 ? "course" : "courses"}.</p>
            <Button type="button" variant="outline" disabled={saving.size > 0 || savingFocus.size > 0} onClick={retry}>Retry</Button>
          </div>}
          {displayed.length ? <AssignmentList assignments={displayed} now={now} {...listActions} />
            : <p className="rounded-xl border border-border bg-card p-5 text-sm">
              {!filteredCourses.length ? "Select courses to see their assignments." : view === "focus"
                ? "Use Add to Focus on any assignment to save it here." : view === "semester"
                  ? "No assignments in these courses." : "No outstanding assignments in these courses."}
            </p>}
          {archived.length > 0 && <details className="mt-6 md:mt-8">
            <summary className="cursor-pointer rounded-xl border border-border/80 bg-card px-4 py-3 text-sm font-medium">Completed and closed <span className="ml-1 text-xs text-muted-foreground">{archived.length}</span></summary>
            <div className="mt-3"><AssignmentList assignments={archived} now={now} {...listActions} /></div>
          </details>}
        </>}
      </Tabs.Panel>)}
    </Tabs.Root>}
    <FocusConfirmation assignment={pendingFocus ? { title: pendingFocus.assignmentName } : null} returnFocus={returnFocus}
      onCancel={() => setPendingFocus(null)} onConfirm={() => {
        if (pendingFocus) void changeFocus(pendingFocus, true);
        setPendingFocus(null);
      }} />
  </div>;
}

function CourseFilter({ courses, selected, onChange }: {
  courses: WorkloadCourse[];
  selected: Set<string>;
  onChange: (ids: Set<string>) => void;
}) {
  const all = selected.size === courses.length;
  return <Menu.Root>
    <Menu.Trigger render={<Button variant="outline" size="lg" className="h-9 min-w-32 justify-between gap-3 rounded-lg bg-card px-3" />}>
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
  onToggleFocus: (assignment: CourseAssignment, button: HTMLButtonElement) => void;
};

function AssignmentList({ assignments, now, reportedMinutes, focusedIds, savingFocus, saving, onEstimate, onDismiss, onToggleFocus }: AssignmentActions & {
  assignments: CourseAssignment[];
  now: number;
  reportedMinutes: ReadonlyMap<string, number>;
  focusedIds: ReadonlySet<string>;
  savingFocus: ReadonlySet<string>;
  saving: ReadonlySet<string>;
}) {
  return <ul className="grid gap-3.5">
    {assignments.map((assignment) => {
      const key = assignmentIdentity(assignment.course.courseId, assignment.assignmentId);
      return <AssignmentRow key={key} assignment={assignment} now={now} reportedMinutes={reportedMinutes.get(key)}
        focused={focusedIds.has(key)} savingFocus={savingFocus.has(key)} dismissing={saving.has(key)}
        onEstimate={onEstimate} onDismiss={onDismiss} onToggleFocus={onToggleFocus} />;
    })}
  </ul>;
}

function AssignmentRow({ assignment, now, reportedMinutes, focused, savingFocus, dismissing, onEstimate, onDismiss, onToggleFocus }: AssignmentActions & {
  assignment: CourseAssignment;
  now: number;
  reportedMinutes?: number;
  focused: boolean;
  savingFocus: boolean;
  dismissing: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [effortOpen, setEffortOpen] = useState(false);
  const effortPanelId = useId();
  const [effortAction, setEffortAction] = useState<"saving" | "removing" | null>(null);
  const [message, setMessage] = useState("");
  const { course, assignmentId } = assignment;
  const deadline = assignmentDeadline(assignment);
  const availability = assignmentAvailability(assignment, now);
  const status = availability.startsWith("Closes") ? "" : availability;
  const grade = !assignment.outstanding ? assignmentGradeBadge(assignment) : null;
  const points = assignment.pointsPossible == null ? "Unavailable" : assignment.pointsPossible.toLocaleString() + " pts";
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
    <ContextMenu.Trigger render={<li className="rounded-2xl border border-border/80 bg-card p-4 text-card-foreground shadow-xs sm:p-5 md:p-6" />} onKeyDown={openMenuFromKeyboard}>
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {course.courseCode && <Badge variant="secondary" className="font-mono">{course.courseCode}</Badge>}
          {course.courseName !== course.courseCode && <span className="wrap-anywhere text-xs text-muted-foreground">{course.courseName}</span>}
        </div>
        <h3 className="text-base font-semibold tracking-tight">
          <a className="inline-flex items-center gap-1.5 wrap-anywhere underline-offset-4 hover:underline"
            target="_blank" rel="noreferrer" href={course.canvasUrl + "/assignments/" + encodeURIComponent(assignmentId)}>
            {assignment.assignmentName}
            <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          </a>
        </h3>
        {status && <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{status}</span>
          {grade && <span className={"rounded-full px-2 py-0.5 font-medium tabular-nums " + gradeColors[grade.color]}>
            Grade {grade.text}
          </span>}
        </p>}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs lg:grid-cols-4 lg:gap-x-6">
        <div><dt className="text-muted-foreground">Points possible</dt><dd className="mt-1 font-medium">{points}</dd></div>
        <div><dt className="text-muted-foreground">Estimated effort</dt><dd className="mt-1 font-medium">{effort}</dd></div>
        <div><dt className="text-muted-foreground">Grade weight</dt><dd className="mt-1 font-medium">{weight}</dd></div>
        <div><dt className="text-muted-foreground">Deadline</dt>
          <dd className="mt-1 font-medium">{deadline.date ? <time dateTime={deadline.date}>{deadline.label} {formatWorkloadDate(deadline.date)}</time> : "No deadline"}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-border/60 pt-3 text-xs">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-auto min-h-9 min-w-0 shrink gap-1.5 whitespace-normal rounded-lg px-2 py-1 leading-tight sm:px-3" aria-expanded={effortOpen} aria-controls={effortPanelId}
            onClick={() => setEffortOpen((open) => !open)}>
            {reportedMinutes === undefined ? "Report time spent" : "Edit reported effort"}
            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className={"size-3.5 text-muted-foreground" + (effortOpen ? " rotate-180" : "")} />
          </Button>
          <Button type="button" variant="outline" className={"h-auto min-h-9 min-w-0 shrink gap-1.5 whitespace-normal rounded-lg px-2 py-1 leading-tight sm:px-3" + (focused ? " border-primary/30 bg-primary/10" : "")}
            aria-pressed={focused} aria-label={(focused ? "Remove from Focus: " : "Add to Focus: ") + assignment.assignmentName}
            disabled={savingFocus} focusableWhenDisabled onClick={(event) => onToggleFocus(assignment, event.currentTarget)}>
            <HugeiconsIcon icon={Bookmark01Icon} aria-hidden="true" className="size-3.5" />
            {savingFocus ? "Saving…" : focused ? "Remove from Focus" : "Add to Focus"}
          </Button>
        </div>
        <div id={effortPanelId} hidden={!effortOpen}>
          <form onSubmit={reportTime} className="mt-3 flex flex-wrap items-end justify-end gap-2">
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
          {assignment.reportCount > 0 && <p className="mt-2 text-right text-muted-foreground">Estimate based on {assignment.reportCount} {assignment.reportCount === 1 ? "report" : "reports"}.</p>}
          {message && <p role="status" className="mt-1 text-right">{message}</p>}
        </div>
      </div>
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
