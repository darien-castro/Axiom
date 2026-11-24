"use client";

import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CourseAssignments from "./course-assignments";

export default function AssignmentsPage() {
  return <Suspense fallback={<LoadingState>Loading assignments…</LoadingState>}>
    <AssignmentView />
  </Suspense>;
}

function AssignmentView() {
  const demo = useSearchParams().get("demo") === "1";
  return <CourseAssignments key={demo ? "demo" : "canvas"} demo={demo} />;
}
