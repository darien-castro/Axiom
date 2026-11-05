"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardSquare01Icon,
  Analytics01Icon,
  ChartHistogramIcon,
  Book02Icon,
  Task01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    name: "Overview (Dashboard)",
    shortName: "Overview",
    href: "/site/dashboard",
    icon: DashboardSquare01Icon,
    dataNeeded: "Cumulative GPA, active assignments",
  },
  {
    name: "Historical Impact",
    shortName: "Historical Impact",
    href: "/site/historical-impact",
    icon: Analytics01Icon,
    dataNeeded: "Past term grades, assignment completion trends",
  },
  {
    name: "Monte Carlo",
    shortName: "Monte Carlo",
    href: "/site/monte-carlo",
    icon: ChartHistogramIcon,
    dataNeeded: "Grade distributions, variance models, simulation bounds",
  },
  {
    name: "Courses",
    shortName: "Courses",
    href: "/site/courses",
    icon: Book02Icon,
    dataNeeded: "Canvas enrolled courses, syllabus weighting, professor data",
  },
  {
    name: "Assignments",
    shortName: "Assignments",
    href: "/site/assignments",
    icon: Task01Icon,
    dataNeeded: "Canvas assignment dates, scores, submission states",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between p-5 select-none">
        <div className="flex flex-col gap-6">
          {/* Brand Header matching login screen */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link
              href="/"
              className="flex items-baseline gap-2.5 transition-opacity hover:opacity-85"
            >
              <span className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Axiom
              </span>
              <span className="rounded-full border border-emerald-200/60 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                @UNCC
              </span>
            </Link>
          </div>

          <Separator className="bg-border/60" />

          {/* Nav List */}
          <nav className="flex flex-col gap-1.5">
            <p className="px-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
              Navigation
            </p>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/site/dashboard" && pathname === "/site");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={`size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground/80 group-hover:text-foreground"
                    }`}
                  />
                  <div className="flex flex-col truncate">
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-emerald-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
          <Link
            href="/site/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground ${
              pathname === "/site/settings"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold"
                : ""
            }`}
          >
            <HugeiconsIcon
              icon={Settings01Icon}
              strokeWidth={1.8}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span>Settings</span>
          </Link>

          {/* Data Connection Status Pill */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[0.68rem] text-muted-foreground font-medium">
                Canvas Sync Active
              </span>
            </div>
            <span className="text-[0.62rem] text-muted-foreground/80 font-mono">
              Demo
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
