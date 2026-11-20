"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import CourseVisibilityControls from "@/components/custom/CourseVisibilityControls";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canvasWorkload, WorkloadRequestError, type WorkloadCourse } from "@/lib/course-workload";
import { demoWorkload } from "@/lib/demo-workload";

type VisibilityState = { status: "loading" | "signed-out" | "error" } | { status: "ready"; courses: WorkloadCourse[] };

export default function CourseVisibilitySettings({ demo = false }: { demo?: boolean }) {
  return <Dialog.Root>
    <Card id="course-visibility" size="sm" className="rounded-2xl border border-border bg-card/60 shadow-xs">
      <CardHeader className="flex flex-1 flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">Course visibility</CardTitle>
          <CardDescription>Choose which courses appear on your workload map. Hidden courses still count towards your workload.</CardDescription>
        </div>
        <Dialog.Trigger render={<Button type="button" variant="outline" size="lg" aria-label="Edit course visibility" />}>
          Edit
        </Dialog.Trigger>
      </CardHeader>
    </Card>

    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(36rem,85dvh)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <Dialog.Title className="text-lg font-semibold tracking-tight">Course visibility</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">Changes save automatically.</Dialog.Description>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
          <CourseVisibilityEditor workload={demo ? demoWorkload : canvasWorkload} />
        </div>
        <div className="flex shrink-0 justify-end border-t border-border px-5 py-3 sm:px-6">
          <Dialog.Close render={<Button type="button" size="lg" className="min-w-16" />}>Done</Dialog.Close>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

function CourseVisibilityEditor({ workload }: { workload: typeof canvasWorkload }) {
  const [state, setState] = useState<VisibilityState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    workload.getWorkloadCourses(controller.signal).then(({ courses }) => {
      if (!controller.signal.aborted) setState({ status: "ready", courses });
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setState({ status: error instanceof WorkloadRequestError && error.status === 401 ? "signed-out" : "error" });
      }
    });
    return () => controller.abort();
  }, [attempt, workload]);

  function updateVisibility(courseId: string, hidden: boolean) {
    setState((previous) => previous.status === "ready" ? {
      ...previous, courses: previous.courses.map((course) => course.courseId === courseId ? { ...course, hidden } : course),
    } : previous);
  }

  return <div className="text-sm">
      {state.status === "loading" && <p role="status" className="text-muted-foreground">Loading courses…</p>}
      {state.status === "signed-out" && <Link href="/" className="font-medium underline underline-offset-4">Sign in with Canvas to manage course visibility</Link>}
      {state.status === "error" && <div className="flex flex-wrap items-center gap-3">
        <p role="alert">Couldn’t load your courses.</p>
        <Button type="button" variant="outline" onClick={() => { setState({ status: "loading" }); setAttempt((current) => current + 1); }}>Try again</Button>
      </div>}
      {state.status === "ready" && (state.courses.length > 0
        ? <CourseVisibilityControls courses={state.courses} onChange={updateVisibility} saveVisibility={workload.saveCourseVisibility} />
        : <p className="text-muted-foreground">No active Canvas courses.</p>)}
  </div>;
}
