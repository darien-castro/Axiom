"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveCourseVisibility, WorkloadRequestError, type WorkloadCourse } from "@/lib/course-workload";

type CourseVisibility = Pick<WorkloadCourse, "courseId" | "courseName" | "courseCode" | "hidden">;

export default function CourseVisibilityControls({ courses, onChange, saveVisibility }: {
  courses: CourseVisibility[];
  onChange: (courseId: string, hidden: boolean) => void;
  saveVisibility: typeof saveCourseVisibility;
}) {
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState("");

  async function toggle(course: CourseVisibility) {
    const { courseId, courseName } = course;
    setPending((current) => new Set(current).add(courseId));
    setErrors((current) => ({ ...current, [courseId]: undefined }));
    setStatus("");
    try {
      const { hidden } = await saveVisibility(courseId, !course.hidden);
      onChange(courseId, hidden);
      setStatus(hidden ? `${courseName} is now hidden.` : `${courseName} is now visible.`);
    } catch (error) {
      setErrors((current) => ({ ...current, [courseId]: error instanceof WorkloadRequestError ? error.message : "Couldn’t save this change. Try again." }));
    } finally {
      setPending((current) => {
        const remaining = new Set(current);
        remaining.delete(courseId);
        return remaining;
      });
    }
  }

  return <div>
    <ul className="divide-y divide-border">
      {courses.map((course) => <li key={course.courseId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="wrap-anywhere text-sm font-medium">{course.courseName}</p>
          {course.courseCode && <p className="text-xs text-muted-foreground">{course.courseCode}</p>}
        </div>
        <Button type="button" variant="outline" size="lg" disabled={pending.has(course.courseId)}
          aria-label={`${course.hidden ? "Show" : "Hide"} ${course.courseName}`}
          onClick={() => void toggle(course)}>
          {pending.has(course.courseId) ? "Saving…" : course.hidden ? "Show" : "Hide"}
        </Button>
        {errors[course.courseId] && <p role="alert" className="basis-full text-xs text-destructive">{errors[course.courseId]}</p>}
      </li>)}
    </ul>
    <p role="status" className="sr-only">{status}</p>
  </div>;
}
