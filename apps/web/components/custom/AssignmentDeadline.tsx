"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { formatWorkloadDate } from "@/lib/course-workload";

const preferenceKey = "axiom-relative-due-dates";
const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useRelativeDueDates() {
  return useSyncExternalStore(subscribe, () => localStorage.getItem(preferenceKey) === "true", () => false);
}

export function setRelativeDueDates(enabled: boolean) {
  localStorage.setItem(preferenceKey, String(enabled));
  window.dispatchEvent(new Event("storage"));
}

export function useDeadlineClock(demo: boolean, snapshot: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (demo) return;
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [demo]);
  return demo ? snapshot : Math.max(snapshot, now ?? 0);
}

const fullDate = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" });

export default function AssignmentDeadline({ date, label = "Due", now, outstanding = true }: {
  date: string | null;
  label?: string;
  now: number;
  outstanding?: boolean;
}) {
  const relative = useRelativeDueDates();
  const timestamp = date ? Date.parse(date) : NaN;
  if (!date || !Number.isFinite(timestamp)) return <span className="text-muted-foreground">No due date</span>;

  const remaining = timestamp - now;
  const upcoming = outstanding && remaining > 0 && label === "Due";
  const color = label !== "Due" ? "text-muted-foreground"
    : upcoming && remaining < 4 * hour ? "text-red-700 dark:text-red-300"
      : upcoming && remaining < 12 * hour ? "text-orange-700 dark:text-orange-300" : undefined;
  const showRelative = relative && upcoming && remaining <= 7 * day;
  const minutes = Math.ceil(remaining / minute);
  const hours = Math.floor(minutes / 60);
  const leftoverMinutes = minutes % 60;
  const duration = remaining > day ? `${Math.floor(remaining / day)}d`
    : [hours ? `${hours}h` : "", leftoverMinutes ? `${leftoverMinutes}m` : ""].filter(Boolean).join(" ");
  const absolute = `${label} ${formatWorkloadDate(date)}`;

  return <time dateTime={date} title={fullDate.format(timestamp)} tabIndex={showRelative ? 0 : undefined}
    className={`group/deadline ${color ?? ""}`}>
    {showRelative ? <>
      <b className="font-normal group-hover/deadline:hidden group-focus/deadline:hidden">Due in <strong>{duration}</strong></b>
      <b className="hidden font-normal group-hover/deadline:inline group-focus/deadline:inline">{absolute}</b>
    </> : absolute}
  </time>;
}
