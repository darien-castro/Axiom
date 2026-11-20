"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setRelativeDueDates, useRelativeDueDates } from "@/components/custom/AssignmentDeadline";

export default function RelativeDatesSettings() {
  const enabled = useRelativeDueDates();
  return <Card className="rounded-2xl border border-border bg-card/60 shadow-xs">
    <CardHeader className="flex flex-row items-center justify-between gap-4">
      <div className="space-y-1">
        <CardTitle>Relative due dates</CardTitle>
        <CardDescription>Show time remaining and the due time for assignments due within seven days.</CardDescription>
      </div>
      <input type="checkbox" role="switch" aria-label="Relative due dates" checked={enabled}
        onChange={(event) => setRelativeDueDates(event.target.checked)}
        className="size-5 shrink-0 cursor-pointer accent-primary" />
    </CardHeader>
  </Card>;
}
