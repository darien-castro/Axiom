"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircleIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import RecentlySubmitted from "./recently-submitted";
import ProjectedGpa from "./semester-gpa";

import NextUp from "./next-up";
import { saveDashboardPreference, useDashboardPreference } from "@/lib/dashboard-preferences";

const titles = { gpa: "Projected GPA", recent: "Recently Submitted", next: "Next Up" };
type Pane = keyof typeof titles;

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<{ firstname?: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState<Pane | null>(null);
  const saved = useDashboardPreference("axiom.dashboardLayout", "gpa,recent,next");
  const panes = Array.from(new Set([...saved.split(","), ...Object.keys(titles)]))
    .filter((id): id is Pane => Object.hasOwn(titles, id));
  function move(from: Pane, to: Pane) {
    const reordered = [...panes];
    reordered.splice(panes.indexOf(from), 1);
    reordered.splice(panes.indexOf(to), 0, from);
    saveDashboardPreference("axiom.dashboardLayout", reordered.join(","));
  }
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          if (isMounted) {
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load dashboard: HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!isMounted) return;

        setDashboardData(data);
        setIsAuthenticated(true);

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-10 p-6 md:p-10 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-foreground">
              {dashboardData?.firstname ? `Welcome back, ${dashboardData.firstname}!` : "Overview"}
            </h1>
          </div>
          <Button variant="outline" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit layout"}</Button>
        </div>
        <Separator className="mt-2 bg-border/60" />
      </div>

      {/* Session Authentication Notification */}
      {isAuthenticated === false && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                No Active Canvas Session Detected
              </h3>
              <p className="text-xs text-muted-foreground">
                Log in with your Canvas API key to synchronize real-time semester courses, current grades, and assignment schedules.
              </p>
            </div>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full border-amber-500/40 text-xs font-medium hover:bg-amber-500/20"
            >
              <span>Connect Canvas Key</span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 shrink-0" />
          <span>Error connecting to backend: {error}.</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {panes.map((id,index) => <div key={id} className={`min-w-0 ${index === 2 ? "lg:col-span-2" : ""} ${editing ? "rounded-2xl border border-dashed p-3" : ""}`}
          onDragOver={e => { if (editing && dragging) e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); if (editing && dragging) move(dragging,id); setDragging(null); }}>
          {editing && <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
            <span draggable onDragStart={e => { e.dataTransfer.setData("text/plain",id); setDragging(id); }} onDragEnd={() => setDragging(null)}
              className="mr-auto cursor-grab select-none">⠿ {titles[id]}</span>
            <button disabled={!index} aria-label={`Move ${titles[id]} earlier`} className="px-2 disabled:opacity-30" onClick={() => move(id,panes[index-1])}>↑</button>
            <button disabled={index === panes.length-1} aria-label={`Move ${titles[id]} later`} className="px-2 disabled:opacity-30" onClick={() => move(id,panes[index+1])}>↓</button>
          </div>}
          {id === "gpa" ? <ProjectedGpa/> : id === "recent" ? <RecentlySubmitted authenticated={isAuthenticated === true} checking={loading && isAuthenticated === null}/> : <NextUp authenticated={isAuthenticated}/>}
        </div>)}
      </div>
    </div>
  );
}
