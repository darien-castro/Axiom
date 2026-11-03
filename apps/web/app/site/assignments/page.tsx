"use client";

import { useState } from "react";
import AssignmentFocusCard from "@/components/custom/focus/AssignmentFocusCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { focusDemoAssignments } from "@/lib/focus-demo-data";
import { assignmentKey, type DemoImportance } from "@/lib/focus-types";

const importanceOrder: Record<DemoImportance, number> = { high: 0, medium: 1, low: 2 };

export default function AssignmentsPage() {
  const [tab, setTab] = useState<"all" | "focus">("all");
  const [sort, setSort] = useState("due");
  const [importance, setImportance] = useState("all");
  const assignments = focusDemoAssignments
    .filter((assignment) => importance === "all" || assignment.demoImportance === importance)
    .slice()
    .sort((a, b) => (sort === "importance" ? importanceOrder[a.demoImportance] - importanceOrder[b.demoImportance] : 0) || Date.parse(a.dueAt) - Date.parse(b.dueAt));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 md:p-10">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">Assignments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Organize your coursework and decide what deserves your attention.</p>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-xs">Sprint 1 · Demo coursework</Badge>
        </div>
        <Separator className="mt-4 bg-border/60" />
      </header>

      <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Sample schedule: November 2026. Effort estimates and importance are demonstration data, not live Canvas information or final-grade impact calculations. Saving assignments will be added in milestone 2.
      </p>

      <div>
        <div role="tablist" aria-label="Assignment views" className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
          {([['all', 'All Assignments'], ['focus', 'My Focus List']] as const).map(([value, label]) => (
            <Button key={value} id={`tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const next = event.key === "Home" ? "all" : event.key === "End" ? "focus" : tab === "all" ? "focus" : "all";
                  setTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }
              }}
              variant={tab === value ? "secondary" : "ghost"}
              className={`h-10 rounded-xl px-4 text-sm ${tab === value ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "text-muted-foreground"}`}>
              {label}{value === "all" && <span className="ml-2 text-xs">{focusDemoAssignments.length}</span>}
            </Button>
          ))}
        </div>

        <section id="panel-all" role="tabpanel" aria-labelledby="tab-all" hidden={tab !== "all"} tabIndex={0} className="pt-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-base font-semibold">All Assignments <span className="ml-2 text-xs font-normal text-muted-foreground">{assignments.length} shown</span></h2>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">Importance
                <select value={importance} onChange={(event) => setImportance(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  <option value="all">All importance levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">Sort by
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  <option value="due">Due date: soonest first</option><option value="importance">Importance: highest first</option>
                </select>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-4">{assignments.map((assignment) => <AssignmentFocusCard key={assignmentKey(assignment)} assignment={assignment} />)}</div>
        </section>

        <section id="panel-focus" role="tabpanel" aria-labelledby="tab-focus" hidden={tab !== "focus"} tabIndex={0} className="pt-6">
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold">Your focus list starts here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">This milestone previews your personal workspace. Adding assignments with bookmark controls and confirmation arrives in milestone 2.</p>
            <Button variant="outline" className="mt-5 h-9 rounded-lg px-4" onClick={() => { setTab("all"); document.getElementById("tab-all")?.focus(); }}>Browse All Assignments</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
