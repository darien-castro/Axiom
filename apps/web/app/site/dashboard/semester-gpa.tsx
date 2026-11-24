"use client";

import { Tabs } from "@base-ui/react/tabs";
import { Popover } from "@base-ui/react/popover";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { getGpaCourses, WorkloadRequestError, type GpaSetup, type GpaTranscriptTotals, type WorkloadCourse } from "@/lib/course-workload";
import { summarizeSemesterGpa } from "@/lib/semester-gpa";
import GpaSetupDialog from "./gpa-setup-dialog";

type CourseState =
  | { status: "loading" | "signed-out" | "error" }
  | { status: "ready"; courses: WorkloadCourse[]; gpaTranscript: GpaTranscriptTotals | null };

const tabClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-active:bg-background data-active:text-foreground data-active:shadow-xs";
const whatIfGrades = ["A", "B", "C", "D", "F"] as const;

export default function ProjectedGpa() {
  const [state, setState] = useState<CourseState>({ status: "loading" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getGpaCourses(controller.signal).then(({ courses, gpaTranscript }) => {
      if (!controller.signal.aborted) setState({ status: "ready", courses, gpaTranscript });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setState({ status: error instanceof WorkloadRequestError && error.status === 401 ? "signed-out" : "error" });
    });
    return () => controller.abort();
  }, []);

  function handleSaved({ credits, transcript }: GpaSetup, complete: boolean) {
    const updatedCredits = new Map(credits.map(({ courseId, creditHours }) => [courseId, creditHours]));
    setState((current) => current.status !== "ready" ? current : {
      status: "ready",
      courses: current.courses.map((course) => {
        const creditHours = updatedCredits.get(course.courseId);
        return creditHours === undefined ? course : { ...course, creditHours };
      }),
      gpaTranscript: transcript ?? current.gpaTranscript,
    });
    setNotice(complete ? "GPA setup complete." : "GPA information saved.");
  }

  return (
    <section aria-labelledby="projected-gpa-heading" className="relative flex min-w-0 flex-col gap-3">
      <h2 id="projected-gpa-heading" className="pr-28 text-lg font-semibold">Projected GPA</h2>
      <Card className="min-h-56 flex-1 gap-3 rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5">
        {state.status === "loading" && <LoadingState className="min-h-24 py-4">Loading grades and credit hours…</LoadingState>}
        {state.status === "signed-out" && <p className="text-sm text-muted-foreground">Connect Canvas to see your GPA estimates.</p>}
        {state.status === "error" && <p role="alert" className="text-sm text-muted-foreground">
          Couldn’t load grades and credit hours. Reload the dashboard to try again.
        </p>}
        {state.status === "ready" && <GpaEstimates courses={state.courses} savedTranscript={state.gpaTranscript} onSaved={handleSaved} />}
        <p role="status" className={notice ? "text-sm text-muted-foreground" : "sr-only"}>{notice}</p>
      </Card>
    </section>
  );
}

function GpaEstimates({ courses, savedTranscript, onSaved }: {
  courses: WorkloadCourse[];
  savedTranscript: GpaTranscriptTotals | null;
  onSaved: (setup: GpaSetup, complete: boolean) => void;
}) {
  const [whatIf, setWhatIf] = useState<Record<string, string>>({});
  const { term, rows, gpa, gpaHours, totalQualityPoints, missingInputs, usedPercentage } = summarizeSemesterGpa(courses);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No active Canvas courses are available.</p>;

  const semesterKey = term ?? `courses:${rows.map(({ course }) => course.courseId).sort()[0]}`;
  const transcript = savedTranscript?.semesterKey === semesterKey ? savedTranscript : null;
  const hasScenario = rows.some(({ course, excluded }) => !excluded && whatIf[course.courseId]);
  const scenario = hasScenario ? summarizeSemesterGpa(rows.map(({ course, excluded }) => ({
    ...course,
    gradeLetter: excluded ? course.gradeLetter : whatIf[course.courseId] || course.gradeLetter,
  }))) : null;
  const semesterHours = scenario?.gpaHours ?? gpaHours;
  const semesterPoints = scenario?.totalQualityPoints ?? totalQualityPoints;
  const overallHours = transcript ? transcript.gpaHours + semesterHours : 0;
  const overallPoints = transcript ? transcript.qualityPoints + semesterPoints : 0;
  const overallGpa = overallHours > 0 ? overallPoints / overallHours : null;
  const reset = scenario && <button type="button" onClick={() => setWhatIf({})}
    className="shrink-0 rounded-sm text-sm font-medium text-destructive underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
    Reset
  </button>;

  return (
    <>
      <Tabs.Root defaultValue="semester" className="flex flex-col gap-3">
        <Tabs.List aria-labelledby="projected-gpa-heading" className="inline-flex self-start gap-1 rounded-lg bg-muted p-1">
          <Tabs.Tab value="semester" className={tabClass}>{term ?? "Semester"}</Tabs.Tab>
          <Tabs.Tab value="overall" className={tabClass}>Overall</Tabs.Tab>
        </Tabs.List>
        <GpaSetupDialog rows={rows} semesterKey={semesterKey} transcript={transcript} onSaved={onSaved} />
        <Tabs.Panel value="semester" className="rounded-md focus-visible:outline-2 focus-visible:outline-ring">
          <div className="flex items-start justify-between gap-3">
            <div aria-live="polite">
              {scenario && <p className="text-xs font-medium text-muted-foreground">What-if estimate</p>}
              <GpaTotal value={scenario ? scenario.gpa : gpa} hours={semesterHours}
                points={semesterPoints}
                pending="Add credit hours and a usable grade to see a semester GPA estimate." />
            </div>
            {reset}
          </div>
          <table className="mt-3 w-full text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th scope="col" className="py-2 pr-2 text-left font-medium">Course</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Grade</th>
                <th scope="col" className="py-2 pl-2 text-right font-medium">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ course, gpaGrade, excluded }) => (
                <tr key={course.courseId}>
                  <th scope="row" className="wrap-anywhere py-2 pr-2 text-left font-medium">
                    {course.courseCode ? <span className="mr-1.5 text-xs text-muted-foreground">{course.courseCode}</span> : null}
                    {course.courseName}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {excluded ? (gpaGrade ?? course.gradeLetter?.trim()) || "—" : (
                      <WhatIfGrade courseName={course.courseName} actualGrade={gpaGrade ?? (course.gradeLetter?.trim() || "—")}
                        override={whatIf[course.courseId]} onChange={(grade) => {
                          setWhatIf((current) => ({ ...current, [course.courseId]: grade }));
                        }} />
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2 pl-2 text-right tabular-nums">
                    {course.creditHours ?? <span className="text-muted-foreground">not set</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usedPercentage && <p className="mt-2 text-xs text-muted-foreground">
            Percentage-only grades use A from 90%, B from 80%, C from 70%, and D from 60%.
          </p>}
        </Tabs.Panel>
        <Tabs.Panel value="overall" className="rounded-md focus-visible:outline-2 focus-visible:outline-ring">
          <div className="flex items-start justify-between gap-3">
            <div aria-live="polite">
              {scenario && <p className="text-xs font-medium text-muted-foreground">What-if estimate</p>}
              <GpaTotal value={overallGpa} hours={overallHours} points={overallPoints}
                pending={transcript ? "GPA will appear once there are GPA hours to include." : "Add your prior transcript totals to see an overall GPA estimate."} />
            </div>
            {reset}
          </div>
          {transcript && <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
            <div className="flex justify-between gap-2 py-2">
              <dt>Prior transcript</dt>
              <dd className="text-right text-muted-foreground">{transcript.gpaHours.toLocaleString()} hours · {transcript.qualityPoints.toFixed(2)} points</dd>
            </div>
            <div className="flex justify-between gap-2 py-2">
              <dt>{term ?? "This semester"}</dt>
              <dd className="text-right text-muted-foreground">{semesterHours.toLocaleString()} hours · {semesterPoints.toFixed(2)} points</dd>
            </div>
          </dl>}
        </Tabs.Panel>
      </Tabs.Root>
      {missingInputs > 0 && <p className="text-xs text-muted-foreground">
        Estimates include courses with a usable grade and credit hours.
      </p>}
    </>
  );
}

function WhatIfGrade({ courseName, actualGrade, override, onChange }: {
  courseName: string;
  actualGrade: string;
  override?: string;
  onChange: (grade: string) => void;
}) {
  return <Popover.Root>
    <Popover.Trigger aria-label={`Edit what-if grade for ${courseName}, ${override ? "projected" : "actual"} grade ${override || actualGrade}`}
      className="rounded-sm text-primary underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
      {override || actualGrade}
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Positioner align="end" sideOffset={8} className="z-50">
        <Popover.Popup className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-left text-sm text-popover-foreground shadow-lg">
          <Popover.Title className="font-semibold">What-if grade</Popover.Title>
          <p className="mt-1 text-xs text-muted-foreground">{courseName} · Actual grade {actualGrade}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {whatIfGrades.map((grade) => <Popover.Close key={grade}
              render={<Button type="button" variant={grade === override ? "default" : "outline"} size="lg" />}
              onClick={() => onChange(grade)}>{grade}</Popover.Close>)}
          </div>
          <div className="mt-3 flex justify-end">
            <Popover.Close render={<Button type="button" variant="ghost" size="lg" disabled={!override} />}
              onClick={() => onChange("")}>Revert</Popover.Close>
          </div>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>;
}

function GpaTotal({ value, hours, points, pending }: { value: number | null; hours: number; points: number; pending: string }) {
  return value === null ? <p className="text-sm text-muted-foreground">{pending}</p> : (
    <div>
      <p className="text-3xl font-semibold tabular-nums">{value.toFixed(3)} <span className="text-sm font-medium text-muted-foreground">GPA</span></p>
      <p className="mt-0.5 text-xs text-muted-foreground">{points.toFixed(2)} quality points ÷ {hours.toLocaleString()} GPA hours</p>
    </div>
  );
}
