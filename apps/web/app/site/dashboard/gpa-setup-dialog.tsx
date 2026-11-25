"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveGpaSetup, WorkloadRequestError, type GpaSetup, type GpaTranscriptTotals } from "@/lib/course-workload";
import { summarizeSemesterGpa } from "@/lib/semester-gpa";

type SemesterRows = ReturnType<typeof summarizeSemesterGpa>["rows"];
type TranscriptSource = "points" | "gpa";

function nonnegativeNumber(value: string | undefined) {
  const number = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function ChecklistItem({ value, title, complete, children }: {
  value: string;
  title: string;
  complete: boolean;
  children: ReactNode;
}) {
  return <Accordion.Item value={value} className="rounded-lg border border-border">
    <Accordion.Header>
      <Accordion.Trigger className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring">
        <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${complete ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
          {complete && <HugeiconsIcon icon={Tick02Icon} className="size-3.5" aria-hidden="true" />}
        </span>
        <span className="flex-1">{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{complete ? "Complete" : "Needed"}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 group-aria-expanded:rotate-180" aria-hidden="true" />
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      <div className="grid gap-3 border-t border-border px-3 py-3">{children}</div>
    </Accordion.Panel>
  </Accordion.Item>;
}

export default function GpaSetupDialog({ rows, semesterKey, transcript, onSaved }: {
  rows: SemesterRows;
  semesterKey: string;
  transcript: GpaTranscriptTotals | null;
  onSaved: (setup: GpaSetup, complete: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});
  const [hours, setHours] = useState("");
  const [priorValue, setPriorValue] = useState("");
  const [source, setSource] = useState<TranscriptSource>("points");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const missingCredits = rows.some(({ course, excluded }) => !excluded && course.creditHours === null);
  const missingGrades = rows.some(({ excluded, gpaGrade }) => !excluded && !gpaGrade);
  const needsSetup = missingCredits || missingGrades || !transcript;

  const draftRows = summarizeSemesterGpa(rows.map(({ course }) => {
    const value = creditDrafts[course.courseId];
    return {
      ...course,
      creditHours: value === undefined ? course.creditHours : nonnegativeNumber(value) ?? null,
    };
  })).rows;
  const creditsComplete = draftRows.every(({ course, excluded }) => excluded || course.creditHours !== null);
  const pendingGrades = draftRows.filter(({ excluded, gpaGrade }) => !excluded && !gpaGrade);
  const invalidCredit = Object.values(creditDrafts).some((value) => value.trim() && nonnegativeNumber(value) === undefined);
  const gpaHours = nonnegativeNumber(hours);
  const priorNumber = gpaHours === 0 ? 0 : nonnegativeNumber(priorValue);
  const points = priorNumber === undefined || gpaHours === undefined ? undefined
    : source === "gpa" ? priorNumber * gpaHours : priorNumber;
  const transcriptComplete = gpaHours !== undefined && points !== undefined &&
    Number.isFinite(points) && points <= gpaHours * 4 && (source === "points" || (priorNumber ?? 0) <= 4);
  const complete = creditsComplete && !invalidCredit && pendingGrades.length === 0 && transcriptComplete;

  function openSetup() {
    setCreditDrafts({});
    setHours(transcript ? String(transcript.gpaHours) : "");
    setPriorValue(transcript ? String(transcript.qualityPoints) : "");
    setSource("points");
    setError("");
    setOpen(true);
  }

  async function save(finished: boolean) {
    if (saving || (finished && !complete)) return;
    const credits = rows.flatMap(({ course }) => {
      const creditHours = nonnegativeNumber(creditDrafts[course.courseId]);
      return creditHours !== undefined && creditHours !== course.creditHours
        ? [{ courseId: course.courseId, creditHours }] : [];
    });
    const nextTranscript = transcriptComplete && gpaHours !== undefined && points !== undefined &&
      (transcript?.gpaHours !== gpaHours || transcript.qualityPoints !== points)
      ? { semesterKey, gpaHours, qualityPoints: points } : undefined;
    if (!credits.length && !nextTranscript) {
      setOpen(false);
      if (finished) onSaved({ credits }, true);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const saved = await saveGpaSetup({ credits, transcript: nextTranscript });
      setOpen(false);
      onSaved(saved, finished);
    } catch (error) {
      setError(error instanceof WorkloadRequestError ? error.message : "Couldn’t save GPA information. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog.Root open={open} onOpenChange={(next, event) => {
    if (saving) event.cancel();
    else if (next) openSetup();
    else setOpen(false);
  }}>
    <Dialog.Trigger render={<Button type="button" variant={needsSetup ? "outline" : "ghost"} size="lg" className="absolute top-0 right-0" />}>
      {needsSetup ? "Setup" : "Configure"}
    </Dialog.Trigger>
    {needsSetup && (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-3">
        <h3 className="text-sm font-semibold">Needs additional information</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Review grades, credit hours, and prior transcript totals.</p>
      </div>
    )}
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        <header className="px-5 pt-5 pb-4">
          <Dialog.Title className="text-lg font-semibold">Set up Projected GPA</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Review your Canvas grades and enter any missing information for your GPA estimates.
          </Dialog.Description>
        </header>
        <form className="flex min-h-0 flex-col" onSubmit={(event) => { event.preventDefault(); void save(true); }} noValidate>
          <div className="overflow-y-auto px-5 pb-4">
            <Accordion.Root defaultValue={[missingCredits ? "credits" : !transcript ? "transcript" : "grades"]} className="grid gap-2">
              <ChecklistItem value="credits" title="Course credit hours" complete={creditsComplete && !invalidCredit}>
                {rows.map(({ course }) => (
                  <label key={course.courseId} className="flex items-center justify-between gap-3 text-sm">
                    <span>{course.courseName}</span>
                    <Input type="number" min={0} step="any" className="h-9 w-24 shrink-0" disabled={saving}
                      placeholder="not set" value={creditDrafts[course.courseId] ?? course.creditHours ?? ""}
                      onChange={(event) => setCreditDrafts({ ...creditDrafts, [course.courseId]: event.target.value })} />
                  </label>
                ))}
                {invalidCredit && <p className="text-sm text-destructive">Credit hours must be zero or greater.</p>}
              </ChecklistItem>
              <ChecklistItem value="grades" title="Current Canvas grades" complete={pendingGrades.length === 0}>
                {pendingGrades.length ? <>
                  <p className="text-sm text-muted-foreground">These courses need a usable current grade from Canvas.</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {pendingGrades.map(({ course }) => <li key={course.courseId}>{course.courseName}</li>)}
                  </ul>
                </> : <p className="text-sm text-muted-foreground">Canvas grades are available for your GPA courses.</p>}
              </ChecklistItem>
              <ChecklistItem value="transcript" title="Prior transcript totals" complete={transcriptComplete}>
                <p className="text-sm text-muted-foreground">
                  Use your totals from before this semester. Enter 0 GPA hours if this is your first semester.
                </p>
                <label className="grid gap-1 text-sm">
                  Prior GPA hours
                  <Input type="number" min={0} step="any" className="h-9" value={hours} disabled={saving}
                    onChange={(event) => setHours(event.target.value)} />
                </label>
                {gpaHours !== 0 && <>
                  <label className="grid gap-1 text-sm">
                    Transcript value
                    <select className="h-9 rounded-md border border-input bg-background px-2" value={source} disabled={saving}
                      onChange={(event) => { setSource(event.target.value === "gpa" ? "gpa" : "points"); setPriorValue(""); }}>
                      <option value="points">Quality points</option>
                      <option value="gpa">Cumulative GPA</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    {source === "gpa" ? "Prior cumulative GPA" : "Prior quality points"}
                    <Input type="number" min={0} max={source === "gpa" ? 4 : undefined} step="any" className="h-9"
                      value={priorValue} disabled={saving} onChange={(event) => setPriorValue(event.target.value)} />
                  </label>
                </>}
                {hours && priorValue && !transcriptComplete &&
                  <p className="text-sm text-destructive">Check that your transcript values are valid for a 4.0 scale.</p>}
              </ChecklistItem>
            </Accordion.Root>
          </div>
          <footer className="grid gap-2 border-t border-border bg-card px-5 py-4">
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{saving ? "Saving…" : "Finish later saves completed entries."}</p>
              <div className="ml-auto flex gap-2">
                <Button type="button" size="lg" variant="outline" disabled={saving} onClick={() => void save(false)}>Finish later</Button>
                <Button type="submit" size="lg" disabled={!complete || saving}>I’m done</Button>
              </div>
            </div>
          </footer>
        </form>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
