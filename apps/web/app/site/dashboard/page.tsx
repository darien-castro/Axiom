"use client";

import {
  GraduationCapIcon,
  Calendar03Icon,
  Clock01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  ArrowRight01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10 p-6 md:p-10 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-foreground">
              Overview
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Academic trajectory, grade projection, and active priorities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              Semester: Fall 2026
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              4 Enrolled Courses
            </Badge>
          </div>
        </div>
        <Separator className="mt-2 bg-border/60" />
      </div>

      {/* 1. PROJECTED GPA PLACEHOLDER RECTANGLE */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={GraduationCapIcon}
              strokeWidth={2}
              className="size-5 text-emerald-600 dark:text-emerald-400"
            />
            <h2 className="text-lg font-semibold text-foreground">
              Projected GPA
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Predictive Model Simulation
          </span>
        </div>

        {/* Placeholder Rectangle (don't implement, just rectangle with data requirements) */}
        <div className="relative w-full rounded-2xl border-2 border-dashed border-border/90 bg-card/40 p-8 md:p-10 transition-all hover:bg-card/60">
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-4 py-6">
            <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon
                icon={GraduationCapIcon}
                strokeWidth={2}
                className="size-6 text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                [ Projected GPA Placeholder Rectangle ]
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Visual interactive chart / gauge calculating estimated cumulative and semester GPA based on live grades and remaining coursework weight.
              </p>
            </div>

            {/* Necessary Data Requirements Callout */}
            <div className="w-full mt-3 rounded-xl border border-border bg-card p-4 text-left shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2.5">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  strokeWidth={2}
                  className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                />
                <span>Data Necessary for Implementation:</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Cumulative GPA:</strong> Past transcript credits & quality points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Credit Hours:</strong> Weight per course (e.g. 3 or 4 credits)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Current Class Grades:</strong> In-progress weighted averages from Canvas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Remaining Assignment Weight:</strong> Uncompleted % in active syllabi</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCROLLING DOWN -> NEXT IMPORTANT ASSIGNMENT (LARGE) */}
      <section className="flex flex-col gap-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-5 text-destructive"
            />
            <h2 className="text-lg font-semibold text-foreground">
              Next Important Assignment
            </h2>
          </div>
          <Badge variant="destructive" className="px-2.5 py-0.5 text-xs font-medium">
            High Priority
          </Badge>
        </div>

        {/* Large Featured Assignment Card */}
        <Card className="overflow-hidden border border-border/90 bg-card shadow-lg rounded-2xl transition-all hover:shadow-xl hover:border-emerald-500/30">
          <div className="p-6 md:p-8 flex flex-col gap-6">
            {/* Top row: Course + Timing */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs font-semibold px-2.5 py-0.5">
                    COMP 3181
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Operating Systems & Architecture
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-card-foreground">
                  Binary Search Tree & Memory Allocator Project
                </h3>
              </div>

              <div className="flex flex-col items-end">
                <Badge variant="destructive" className="text-xs px-3 py-1 font-semibold">
                  Affects 20% of Grade
                </Badge>
                <span className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
                  Due Tuesday, Oct 27th • 11:59 PM
                </span>
              </div>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
              Implement a custom heap memory allocation algorithm and balanced tree indexer in C. Includes thread safety locks, fragmentation benchmarks, and an end-to-end stress test suite.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-card border border-border">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-[0.68rem] text-muted-foreground uppercase font-medium">Estimated Time</div>
                  <div className="text-sm font-semibold text-foreground">8 Hours Needed</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-card border border-border">
                  <HugeiconsIcon icon={Task01Icon} strokeWidth={2} className="size-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-[0.68rem] text-muted-foreground uppercase font-medium">Assignment Type</div>
                  <div className="text-sm font-semibold text-foreground">Major Project</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-card border border-border">
                  <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 text-destructive" />
                </div>
                <div>
                  <div className="text-[0.68rem] text-muted-foreground uppercase font-medium">Standing Risk</div>
                  <div className="text-sm font-semibold text-foreground">Drops to &lt;B if &lt;70%</div>
                </div>
              </div>
            </div>

            {/* Necessary Data Requirements Callout for Assignment */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  strokeWidth={2}
                  className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                />
                <span>Data Necessary for Next Important Assignment:</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Canvas API Assignment Object:</strong> ID, name, description, due date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Grade Weight Distribution:</strong> Syllabus weighting or assignment group %</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Submission Status:</strong> Submitted timestamp, grading state, points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Impact Ranking Algorithm:</strong> Urgency (days left) × Weight %</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. SUBSEQUENT UPCOMING ASSIGNMENTS (For natural scroll experience) */}
      <section className="flex flex-col gap-4 pt-4 pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Subsequent Upcoming Work
          </h2>
          <span className="text-xs text-muted-foreground">
            Canvas Synced Queue
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-border/80 bg-card/60 p-5 rounded-xl hover:bg-card transition-all">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-[0.68rem]">MATH 1241</Badge>
              <Badge variant="outline" className="text-[0.68rem]">Affect 2%</Badge>
            </div>
            <h4 className="text-sm font-semibold text-card-foreground">Calculus Homework 3: Integration</h4>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Time: 50 Minutes</span>
              <span>Due Thursday, Oct 29th</span>
            </div>
          </Card>

          <Card className="border border-border/80 bg-card/60 p-5 rounded-xl hover:bg-card transition-all">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-[0.68rem]">ENGL 1102</Badge>
              <Badge variant="destructive" className="text-[0.68rem]">Affect 15%</Badge>
            </div>
            <h4 className="text-sm font-semibold text-card-foreground">Rhetorical Analysis Final Draft</h4>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Time: 6 Hours</span>
              <span>Due Friday, Oct 30th</span>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
