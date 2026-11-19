"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CourseAssignments from "./course-assignments";

export default function AssignmentsPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading assignments…</p>}>
    <AssignmentView />
  </Suspense>;
}

function AssignmentView() {
  const demo = useSearchParams().get("demo") === "1";
  return <CourseAssignments key={demo ? "demo" : "canvas"} demo={demo} />;
}
