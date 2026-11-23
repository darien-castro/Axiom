"use client";

import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  assignmentIdentity, formatWorkloadDate, getAssignmentWorkspace, getWorkloadAssignments,
  saveAssignmentDismissal, saveWorkloadMinutes, WorkloadRequestError,
} from "@/lib/course-workload";

const windowMs = 72 * 60 * 60 * 1000;
const refreshInterval = 60_000;

type Submission = {
  courseId: string;
  courseLabel: string;
  assignmentId: string;
  assignmentName: string;
  submittedAt: string;
  timestamp: number;
  reportedMinutes?: number;
};

type Snapshot = { submissions: Submission[]; failedCourses: number };

async function loadSubmissions(signal: AbortSignal): Promise<Snapshot> {
  const { courses, dismissedAssignments = [], timeReports = [] } = await getAssignmentWorkspace(signal);
  const visibleCourses = courses.filter(({ hidden }) => !hidden);
  const dismissed = new Set(dismissedAssignments.map(({ courseId, assignmentId }) =>
    assignmentIdentity(courseId, assignmentId),
  ));
  const reports = new Map(timeReports.map(({ courseId, assignmentId, minutes }) =>
    [assignmentIdentity(courseId, assignmentId), minutes] as const,
  ));
  const latest = new Map<string, Submission>();
  let failedCourses = 0;
  const now = Date.now();

  for (let i = 0; i < visibleCourses.length; i += 4) {
    signal.throwIfAborted();
    await Promise.all(visibleCourses.slice(i, i + 4).map(async (course) => {
      const { courseId, courseCode, courseName } = course;
      try {
        const { assignments } = await getWorkloadAssignments(courseId, signal);
        for (const { assignmentId, assignmentName, submittedAt } of assignments) {
          if (!submittedAt) continue;
          const timestamp = Date.parse(submittedAt);
          if (!Number.isFinite(timestamp) || timestamp < now - windowMs || timestamp > now) continue;
          const key = assignmentIdentity(courseId, assignmentId);
          if (dismissed.has(key) || (latest.get(key)?.timestamp ?? -Infinity) >= timestamp) continue;
          latest.set(key, { courseId, courseLabel: courseCode || courseName, assignmentId, assignmentName, submittedAt, timestamp,
            reportedMinutes: reports.get(key) });
        }
      } catch {
        failedCourses++;
      }
    }));
  }

  signal.throwIfAborted();
  return { submissions: [...latest.values()].sort((a, b) => b.timestamp - a.timestamp), failedCourses };
}

export default function RecentlySubmitted() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [now, setNow] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<string>();
  const [pending, setPending] = useState<string>();
  const [actionError, setActionError] = useState("");
  const [status, setStatus] = useState("");
  const request = useRef<AbortController | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    let lastCheck = 0;

    async function refresh() {
      if (saving.current) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      lastCheck = Date.now();
      try {
        const result = await loadSubmissions(controller.signal);
        if (controller.signal.aborted) return;
        setSnapshot(result);
        setNow(Date.now());
        setLoadError(false);
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      }
    }

    function refreshOnFocus() {
      setNow(Date.now());
      if (Date.now() - lastCheck >= refreshInterval) void refresh();
    }

    void refresh();
    window.addEventListener("focus", refreshOnFocus);
    const timer = window.setInterval(() => setNow(Date.now()), refreshInterval);
    return () => {
      request.current?.abort();
      window.removeEventListener("focus", refreshOnFocus);
      window.clearInterval(timer);
    };
  }, [attempt]);

  async function update(submission: Submission, minutes: number | null) {
    if (saving.current) return;
    saving.current = true;
    request.current?.abort();
    const { courseId, assignmentId, assignmentName } = submission;
    const key = assignmentIdentity(courseId, assignmentId);
    setPending(key);
    setActionError("");
    setStatus("");

    try {
      if (minutes === null) await saveAssignmentDismissal(courseId, assignmentId, true);
      else await saveWorkloadMinutes(courseId, assignmentId, minutes);

      setSnapshot((current) => current && {
        ...current,
        submissions: current.submissions.flatMap((row) => {
          if (row.courseId !== courseId || row.assignmentId !== assignmentId) return [row];
          return minutes === null ? [] : [{ ...row, reportedMinutes: minutes }];
        }),
      });
      setEditing(undefined);
      setStatus(minutes === null ? `${assignmentName} dismissed.` : `Effort saved for ${assignmentName}.`);
    } catch (error) {
      setActionError(error instanceof WorkloadRequestError ? error.message : "Couldn’t save the change. Try again.");
    } finally {
      saving.current = false;
      setPending(undefined);
    }
  }

  function reportEffort(event: FormEvent<HTMLFormElement>, submission: Submission) {
    event.preventDefault();
    const minutes = Number(new FormData(event.currentTarget).get("minutes"));
    if (Number.isInteger(minutes) && minutes > 0) void update(submission, minutes);
  }

  const submissions = snapshot?.submissions.filter(({ timestamp }) => timestamp >= now - windowMs) ?? [];
  const failedCourses = snapshot?.failedCourses ?? 0;

  return <section aria-labelledby="recently-submitted-title">
    <Card className="gap-3 rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5">
      <h2 id="recently-submitted-title" className="text-base font-semibold">Recently Submitted</h2>
      {!snapshot && !loadError && <LoadingState className="min-h-24 py-4">Checking recent submissions…</LoadingState>}
      {(loadError || failedCourses > 0) && <div className="flex flex-wrap items-center gap-2 text-sm">
        <p role="alert" className="text-muted-foreground">{loadError ? "Couldn’t check recent submissions."
          : `Couldn’t check submissions for ${failedCourses} ${failedCourses === 1 ? "course" : "courses"}.`}</p>
        <Button type="button" variant="outline" disabled={pending !== undefined} onClick={() => setAttempt((value) => value + 1)}>Retry</Button>
      </div>}
      {snapshot && !loadError && failedCourses === 0 && submissions.length === 0 &&
        <p className="text-sm text-muted-foreground">Nothing here</p>}
      <p role="status" className="sr-only">{status}</p>
      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
      {submissions.length > 0 && <ul className="divide-y divide-border/70">
        {submissions.map((submission) => {
          const key = assignmentIdentity(submission.courseId, submission.assignmentId);
          const hasReport = submission.reportedMinutes !== undefined;
          return <li key={key} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="wrap-anywhere text-sm font-semibold">{submission.assignmentName}</h3>
                <p className="wrap-anywhere text-xs text-muted-foreground">
                  {submission.courseLabel} · Submitted <time dateTime={submission.submittedAt}>{formatWorkloadDate(submission.submittedAt)}</time>
                  {hasReport && ` · ${submission.reportedMinutes} min reported`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" variant="outline" size="lg" aria-expanded={editing === key} disabled={pending !== undefined}
                  onClick={() => { setActionError(""); setEditing(editing === key ? undefined : key); }}>
                  {hasReport ? "Edit effort" : "Report effort"}
                </Button>
                <Button type="button" variant="ghost" size="lg" aria-label={`Dismiss ${submission.assignmentName}`}
                  disabled={pending !== undefined} onClick={() => void update(submission, null)}>Dismiss</Button>
              </div>
            </div>
            {editing === key && <form onSubmit={(event) => reportEffort(event, submission)} className="mt-3 flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs text-muted-foreground">Minutes spent
                <input name="minutes" type="number" min={1} max={2_147_483_647} step={1} required defaultValue={submission.reportedMinutes}
                  className="h-8 w-28 rounded-md border border-border bg-background px-2 text-sm text-foreground" />
              </label>
              <Button type="submit" size="lg" disabled={pending !== undefined}>{pending === key ? "Saving…" : "Save effort"}</Button>
            </form>}
          </li>;
        })}
      </ul>}
    </Card>
  </section>;
}
