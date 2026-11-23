"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { getWorkloadCourses, WorkloadRequestError, type WorkloadCourse } from "@/lib/course-workload";
import { summarizeSemesterGpa } from "@/lib/semester-gpa";

type CourseState =
  | { status: "loading" | "signed-out" | "error" }
  | { status: "ready"; courses: WorkloadCourse[] };

export default function SemesterGpa() {
  const [state, setState] = useState<CourseState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getWorkloadCourses(controller.signal).then(({ courses }) => {
      if (!controller.signal.aborted) setState({ status: "ready", courses });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setState({ status: error instanceof WorkloadRequestError && error.status === 401 ? "signed-out" : "error" });
    });
    return () => controller.abort();
  }, []);

  if (state.status !== "ready") {
    if (state.status === "loading") return <LoadingState>Loading grades and credit hours…</LoadingState>;
    return (
      <p className="text-sm text-muted-foreground">
        {state.status === "signed-out"
          ? "Connect Canvas to see your semester GPA estimate."
          : "Couldn’t load grades and credit hours. Reload the dashboard to try again."}
      </p>
    );
  }

  const { term, rows, gpa, gpaHours, totalQualityPoints, missingInputs, usedPercentage } =
    summarizeSemesterGpa(state.courses);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No active Canvas courses are available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">
          {term ? `${term} GPA estimate` : "Current semester GPA estimate"}
        </h3>
        {gpa !== null ? (
          <>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{gpa.toFixed(3)}</p>
            <p className="text-sm text-muted-foreground">
              {totalQualityPoints.toFixed(2)} quality points ÷ {gpaHours.toLocaleString()} GPA hours
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            A GPA estimate needs a usable Canvas grade and positive credit hours for at least one course.
          </p>
        )}
      </div>

      {missingInputs > 0 && (
        <p className="text-sm text-muted-foreground">
          {missingInputs === 1 ? "One course is missing" : `${missingInputs} courses are missing`} a usable grade or credit hours.
          {" "}<Link href="/site/courses" className="underline underline-offset-2">Manage credit hours in Courses</Link>.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="py-2 pr-3 text-left font-medium">Course</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Grade</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Credit hours</th>
              <th scope="col" className="py-2 pl-2 text-right font-medium">Quality points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ course, gpaGrade, qualityPoints, excluded }) => (
              <tr key={course.courseId}>
                <th scope="row" className="py-2 pr-3 text-left font-medium">{course.courseName}</th>
                <td className="px-2 py-2 text-right tabular-nums">
                  {gpaGrade ?? (course.gradeLetter?.trim() || "—")}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{course.creditHours ?? "—"}</td>
                <td className="py-2 pl-2 text-right tabular-nums">
                  {excluded ? "Excluded" : qualityPoints?.toFixed(2) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {usedPercentage && (
        <p className="text-xs text-muted-foreground">
          Where Canvas provides only a percentage, this estimate uses A from 90%, B from 80%, C from 70%, and D from 60%.
        </p>
      )}
    </div>
  );
}
