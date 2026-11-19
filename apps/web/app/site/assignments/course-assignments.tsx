"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  assignmentAvailability, dueTime, formatWorkloadDate, getWorkloadAssignments,
  getWorkloadCourses, saveWorkloadMinutes, WorkloadRequestError, type WorkloadAssignment, type WorkloadCourse,
} from "@/lib/course-workload";

type CourseView = { status: "loading" | "signed-out" | "error" | "missing" }
  | { status: "ready"; course: WorkloadCourse; assignments: WorkloadAssignment[]; now: number };

export default function CourseAssignments({ courseId }: { courseId: string }) {
  const [view, setView] = useState<CourseView>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { courses } = await getWorkloadCourses(controller.signal);
        if (controller.signal.aborted) return;
        const course = courses.find((entry) => entry.courseId === courseId);
        if (!course) {
          setView({ status: "missing" });
          return;
        }
        const { assignments } = await getWorkloadAssignments(courseId, controller.signal);
        if (!controller.signal.aborted) {
          setView({ status: "ready", course, now: Date.now(), assignments: [...assignments].sort((a, b) =>
            Number(b.outstanding) - Number(a.outstanding) || dueTime(a) - dueTime(b) || a.assignmentName.localeCompare(b.assignmentName),
          ) });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setView({ status: error instanceof WorkloadRequestError && error.status === 401 ? "signed-out" : "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [courseId]);

  return <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-8">
    <Link href="/site/courses" className="w-fit text-sm font-medium underline underline-offset-4">← Courses</Link>
    <header>
      {view.status === "ready" && <p className="mb-1 text-sm text-muted-foreground">{view.course.courseCode}</p>}
      <h1 className="text-3xl font-bold tracking-tight">{view.status === "ready" ? view.course.courseName : "Course assignments"}</h1>
    </header>
    {view.status === "loading" && <p role="status">Loading Canvas assignments…</p>}
    {view.status === "signed-out" && <Link href="/" className="underline">Sign in with Canvas to see your assignments</Link>}
    {view.status === "missing" && <p>This course is outside your active Canvas enrollments.</p>}
    {view.status === "error" && <p role="alert">Couldn’t load these Canvas assignments. Reload the page to try again.</p>}
    {view.status === "ready" && (view.assignments.length ? <ul className="grid gap-3">
      {view.assignments.map((assignment) => <AssignmentRow key={assignment.assignmentId} assignment={assignment} course={view.course} now={view.now} />)}
    </ul> : <p>No assignments found for this course.</p>)}
  </div>;
}

function AssignmentRow({ assignment, course, now }: { assignment: WorkloadAssignment; course: WorkloadCourse; now: number }) {
  const [estimate, setEstimate] = useState({ estimatedMinutes: assignment.estimatedMinutes, reportCount: assignment.reportCount });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const availability = assignmentAvailability(assignment, now);

  async function reportTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(new FormData(event.currentTarget).get("minutes"));
    setSaving(true);
    try {
      setEstimate(await saveWorkloadMinutes(course.courseId, assignment.assignmentId, minutes));
      setMessage("Time report saved.");
    } catch (error) {
      setMessage(error instanceof WorkloadRequestError ? error.message : "Couldn’t save your time report. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return <li className="rounded-xl border border-border bg-card p-4">
    <a className="font-semibold hover:underline" target="_blank" rel="noreferrer" href={`${course.canvasUrl}/assignments/${encodeURIComponent(assignment.assignmentId)}`}>{assignment.assignmentName} <span aria-hidden="true">↗</span></a>
    <p className="mt-1 text-sm text-muted-foreground">{assignment.dueAt ? `Due ${formatWorkloadDate(assignment.dueAt)}` : "No due date"}{availability && ` · ${availability}`}</p>
    <p className="mt-1 text-sm text-muted-foreground">{estimate.estimatedMinutes === null ? "No time reports yet" : `About ${Math.round(estimate.estimatedMinutes)} min · ${estimate.reportCount} ${estimate.reportCount === 1 ? "report" : "reports"}`}</p>
    <details className="mt-3 text-sm">
      <summary className="w-fit cursor-pointer font-medium underline underline-offset-4">Report time spent</summary>
      <form onSubmit={reportTime} className="mt-3 flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs">Minutes spent
          <input name="minutes" type="number" min="1" step="1" required className="h-8 w-28 rounded-md border border-border bg-background px-2 text-sm" />
        </label>
        <Button size="sm" variant="outline" type="submit" disabled={saving}>{saving ? "Saving…" : "Save time"}</Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">Saving again updates your report for this assignment.</p>
      {message && <p role="status" className="mt-1 text-sm">{message}</p>}
    </details>
  </li>;
}
