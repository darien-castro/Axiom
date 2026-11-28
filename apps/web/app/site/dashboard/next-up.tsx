"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AssignmentDeadline, { useDeadlineClock } from "@/components/custom/AssignmentDeadline";
import { assignmentIdentity, canvasWorkload } from "@/lib/course-workload";
import { assignmentDeadline, isClosed, sortAssignments, type CourseAssignment } from "@/lib/assignment-ranking";
import { nextUpFilters, useNextUpFilter } from "@/lib/dashboard-preferences";

export default function NextUp({ authenticated }: { authenticated: boolean | null }) {
  const filter = useNextUpFilter();
  const [data, setData] = useState<{ rows: CourseAssignment[]; now: number; partial: boolean }>();
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const now = useDeadlineClock(false, data?.now ?? 0);
  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    const { signal } = controller;
    async function load() {
      const { courses, dismissedAssignments = [] } = await canvasWorkload.getAssignmentWorkspace(signal);
      const dismissed = new Set(dismissedAssignments.map(a => assignmentIdentity(a.courseId, a.assignmentId)));
      const visible = courses.filter(c => !c.hidden);
      const rows: CourseAssignment[] = [];
      let partial = false;
      for (let i = 0; i < visible.length && !signal.aborted; i += 4) {
        await Promise.all(visible.slice(i,i+4).map(async course => {
          try {
            const { assignments } = await canvasWorkload.getRankableAssignments(course.courseId, signal);
            for (const a of assignments) {
              if (a.outstanding && !dismissed.has(assignmentIdentity(course.courseId,a.assignmentId))) rows.push({ ...a, course });
            }
          } catch { partial = true; }
        }));
      }
      if (!signal.aborted) { setData({ rows, now: Date.now(), partial }); setError(false); }
    }
    load().catch(() => { if (!signal.aborted) setError(true); });
    return () => controller.abort();
  }, [authenticated, attempt]);
  const [first, ...chips] = sortAssignments((data?.rows ?? []).filter(a => !isClosed(a,now)),filter,now).slice(0,3);
  return <section className="space-y-3">
    <header className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Next Up</h2>
      <Link className="text-sm underline underline-offset-4" href={`/site/assignments?view=${filter}`}>View assignments →</Link></header>
    {error || data?.partial ? <p className="text-sm">Some coursework couldn’t load. <button className="underline" onClick={() => retry(attempt+1)}>Retry</button></p> : null}
    {first ? <><article className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{first.course.courseCode || first.course.courseName}</span>{nextUpFilters[filter]}</div>
      <h3 className="my-3 text-2xl font-semibold tracking-tight">{first.assignmentName}</h3>
      <div className="text-sm text-muted-foreground"><AssignmentDeadline {...assignmentDeadline(first)} now={now}/>{first.pointsPossible !== null && ` · ${first.pointsPossible} pts`}</div>
    </article><div className="flex flex-wrap gap-2">{chips.map(a => <span key={assignmentIdentity(a.course.courseId,a.assignmentId)} className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{a.assignmentName} <small className="text-muted-foreground">{a.course.courseCode || a.course.courseName}</small></span>)}</div></>
    : !error && !data?.partial && <p className="text-sm text-muted-foreground">{authenticated === false ? "Connect Canvas to see upcoming work." : data ? "No outstanding assignments." : "Loading upcoming work…"}</p>}
  </section>;
}
