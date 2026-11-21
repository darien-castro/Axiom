"use client";

import { Popover } from "@base-ui/react/popover";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RankableAssignment } from "@/lib/course-workload";

const gradeFormat = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 2 });
const differenceFormat = new Intl.NumberFormat(undefined, { signDisplay: "exceptZero", maximumFractionDigits: 2 });

function GradeDifference({ projected, current }: { projected: number; current: number | null }) {
  if (current == null || !Number.isFinite(current)) return null;
  const difference = Math.round((projected - current) * 100) / 100;
  const label = differenceFormat.format(difference);
  const color = difference > 0 ? "text-emerald-700 dark:text-emerald-300"
    : difference < 0 ? "text-red-700 dark:text-red-300" : "text-muted-foreground";

  return <span className={`whitespace-nowrap text-xs font-medium tabular-nums ${color}`}
    title={`${label} percentage points vs. current course grade`}>
    <span aria-hidden="true">{difference > 0 ? "↑ " : difference < 0 ? "↓ " : ""}{label}%</span>
    <span className="sr-only">{label} percentage points vs. current course grade</span>
  </span>;
}

export default function AssignmentGradeProjection({ assignment, currentGrade, score, onScoreChange }: {
  assignment: RankableAssignment;
  currentGrade: number | null;
  score: number;
  onScoreChange: (score: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { assignmentName, gradeProjection, pointsPossible } = assignment;

  if (!gradeProjection) {
    return <div>
      <dt className="text-muted-foreground">Course grade if 0 pts</dt>
      <dd className="mt-1 text-muted-foreground">Unavailable</dd>
    </div>;
  }

  const grade = (points: number) => gradeProjection.gradeAtZero + points * gradeProjection.percentPerPoint;
  const formattedGrade = (points: number) => gradeFormat.format(grade(points) / 100);
  const draftScore = draft.trim() ? Number(draft) : NaN;
  const valid = Number.isFinite(draftScore) && draftScore >= 0 && Number.isFinite(grade(draftScore));
  const label = `Course grade if ${score.toLocaleString()} pts`;
  const result = formattedGrade(score);

  function apply(points: number) {
    onScoreChange(points);
    setOpen(false);
  }

  return <div>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-medium">
      <Popover.Root open={open} onOpenChange={(next) => {
        if (next) setDraft(String(score));
        setOpen(next);
      }}>
        <Popover.Trigger aria-label={`${label}: ${result}. Edit What If score for ${assignmentName}`}
          className="rounded-sm text-left text-primary underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
          {result}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} align="start" className="z-50">
            <Popover.Popup initialFocus={input} className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-sm text-popover-foreground shadow-lg">
              <Popover.Title className="font-semibold">What If score</Popover.Title>
              <form className="mt-3 grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                if (valid) apply(draftScore);
              }}>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Score in points{pointsPossible != null && ` (out of ${pointsPossible.toLocaleString()})`}
                  <input ref={input} type="number" min={0} step="any" required value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground" />
                </label>
                <p className="text-xs text-muted-foreground">Estimated course grade <output className="inline-flex flex-wrap items-baseline gap-x-1.5 font-semibold text-foreground">
                  {valid ? formattedGrade(draftScore) : "—"}
                  {valid && <GradeDifference projected={grade(draftScore)} current={currentGrade} />}
                </output></p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="lg" onClick={() => apply(0)}>Reset to zero</Button>
                  <Button type="submit" size="lg" disabled={!valid}>Apply</Button>
                </div>
              </form>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <GradeDifference projected={grade(score)} current={currentGrade} />
    </dd>
  </div>;
}
