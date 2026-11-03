"use client";

import { useEffect, useRef, useState } from "react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import AssignmentFocusCard from "@/components/custom/focus/AssignmentFocusCard";
import FocusConfirmation from "@/components/custom/focus/FocusConfirmation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { focusDemoAssignments } from "@/lib/focus-demo-data";
import { assignmentKey, type DemoImportance, type FocusAssignment } from "@/lib/focus-types";
import { readFocusIds, writeFocusIds } from "@/lib/focus-list";

const importanceOrder: Record<DemoImportance, number> = { high: 0, medium: 1, low: 2 };
const validFocusIds = new Set(focusDemoAssignments.map(assignmentKey));

export default function AssignmentsPage() {
  const [tab, setTab] = useState<"all" | "focus">("all");
  const [sort, setSort] = useState("due");
  const [importance, setImportance] = useState("all");
  // Start identically on server and client; read browser-specific storage after mount.
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<FocusAssignment | null>(null);
  const [feedback, setFeedback] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      // Synchronize external browser storage only after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusIds(readFocusIds(window.localStorage, validFocusIds));
    } catch {
      setStorageUnavailable(true);
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    // Never overwrite existing selections with the initial empty server state.
    if (!storageReady || storageUnavailable) return;
    try {
      writeFocusIds(window.localStorage, focusIds);
    } catch {
      // Storage can be blocked or full; retain functional in-memory selections.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageUnavailable(true);
    }
  }, [focusIds, storageReady, storageUnavailable]);
  const compareAssignments = (a: FocusAssignment, b: FocusAssignment) =>
    (sort === "importance" ? importanceOrder[a.demoImportance] - importanceOrder[b.demoImportance] : 0) || Date.parse(a.dueAt) - Date.parse(b.dueAt);
  const assignments = focusDemoAssignments
    .filter((assignment) => importance === "all" || assignment.demoImportance === importance)
    .slice()
    .sort(compareAssignments);
  // All saved assignments remain visible regardless of the All Assignments filter.
  const focusedAssignments = focusDemoAssignments.filter((assignment) => focusIds.includes(assignmentKey(assignment))).sort(compareAssignments);

  function handleFocusAction(assignment: FocusAssignment, button: HTMLButtonElement) {
    if (!storageReady) return;
    const id = assignmentKey(assignment);
    if (focusIds.includes(id)) {
      setFocusIds((current) => current.filter((savedId) => savedId !== id));
      setFeedback(`${assignment.title} removed from My Focus List.`);
      if (tab === "focus") document.getElementById("tab-focus")?.focus();
    } else {
      returnFocus.current = button;
      setPendingAssignment(assignment);
    }
  }

  function confirmFocus() {
    if (!pendingAssignment) return;
    const id = assignmentKey(pendingAssignment);
    setFocusIds((current) => current.includes(id) ? current : [...current, id]);
    setFeedback(`${pendingAssignment.title} added to My Focus List.`);
    setPendingAssignment(null);
  }

  function renderAssignment(assignment: FocusAssignment) {
    return <AssignmentFocusCard key={assignmentKey(assignment)} assignment={assignment}
      disabled={!storageReady}
      saved={focusIds.includes(assignmentKey(assignment))}
      onFocusAction={(button) => handleFocusAction(assignment, button)} />;
  }

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

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Demo mode · Sample assignments and estimated priorities. Not synced with Canvas.
      </p>
      {storageUnavailable && <p role="status" className="text-xs text-muted-foreground">Browser storage is unavailable. Focus changes are kept only while this page is open.</p>}

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
              {label}<span className="ml-2 text-xs">{value === "all" ? focusDemoAssignments.length : focusIds.length}</span>
            </Button>
          ))}
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 min-h-5 text-xs text-emerald-700">{feedback}</p>

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
          <div className="flex flex-col gap-4">{assignments.map(renderAssignment)}</div>
        </section>

        <section id="panel-focus" role="tabpanel" aria-labelledby="tab-focus" hidden={tab !== "focus"} tabIndex={0} className="pt-6">
          {focusedAssignments.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">My Focus List</h2>
                <Button variant="outline" className="h-9 rounded-lg px-4" onClick={() => { setTab("all"); document.getElementById("tab-all")?.focus(); }}>Browse All Assignments</Button>
              </div>
              <p className="text-xs text-muted-foreground">Your personal selections, separate from demo-derived importance. Ordered by {sort === "due" ? "due date" : "importance"}.</p>
              {focusedAssignments.map(renderAssignment)}
            </div>
          ) : <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold">Your focus list starts here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{storageReady ? "Choose Add to Focus on any assignment in All Assignments, then confirm to build your personal list." : "Loading your saved focus list…"}</p>
            <Button variant="outline" className="mt-5 h-9 rounded-lg px-4" onClick={() => { setTab("all"); document.getElementById("tab-all")?.focus(); }}>Browse All Assignments</Button>
          </div>}
        </section>
      </div>
      <FocusConfirmation assignment={pendingAssignment} returnFocus={returnFocus}
        onCancel={() => setPendingAssignment(null)} onConfirm={confirmFocus} />
    </div>
  );
}
