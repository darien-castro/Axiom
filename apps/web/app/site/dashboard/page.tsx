"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCapIcon,
  Calendar03Icon,
  Clock01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  ArrowRight01Icon,
  Task01Icon,
  Book02Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseInfo {
  courseID: string;
  courseName: string;
  courseTerm?: string;
  courseTermId?: string;
  courseCode?: string;
  courseSection?: string;
  courseDepartment?: string;
}

interface GradeInfo {
  userID: string;
  courseID: string;
  grade: string;
}

interface DashboardInfo {
  firstname: string;
  lastname?: string;
  courses?: CourseInfo[];
  gradeinfo?: GradeInfo[];
}

interface RawAssignmentResponse {
  courseId?: string | number;
  assignmentName?: string;
  assignmentType?: string;
  assignmentPoints?: number | null;
}

interface RealAssignment {
  courseId: string | number;
  courseCode?: string;
  assignmentName: string;
  assignmentType?: string;
  assignmentPoints?: number | null;
}

function formatSemesterTerm(term?: string): string {
  if (!term || term.trim() === "") return "Current Semester";
  if (/^[A-Za-z]+\s+\d{4}$/.test(term.trim())) return term.trim();
  if (/^\d{6}$/.test(term.trim())) {
    const year = term.slice(0, 4);
    const code = term.slice(4, 6);
    if (code === "80") return `Fall ${year}`;
    if (code === "10") return `Spring ${year}`;
    if (code === "50" || code === "60") return `Summer ${year}`;
  }
  return term;
}

function formatGradeBadge(rawGrade?: string | number | null): {
  text: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (rawGrade === undefined || rawGrade === null || rawGrade === "") {
    return { text: "In Progress", variant: "outline" };
  }
  const num = parseFloat(String(rawGrade));
  if (!isNaN(num)) {
    const formatted = `${num.toFixed(1)}%`;
    if (num >= 90) return { text: formatted, variant: "default" };
    if (num >= 80) return { text: formatted, variant: "secondary" };
    if (num >= 70) return { text: formatted, variant: "outline" };
    return { text: formatted, variant: "destructive" };
  }
  return { text: String(rawGrade), variant: "secondary" };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardInfo | null>(null);
  const [realAssignments, setRealAssignments] = useState<RealAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/dashboard`, {
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

        const data: DashboardInfo = await response.json();
        if (!isMounted) return;

        setDashboardData(data);
        setIsAuthenticated(true);

        const courses = data.courses || [];
        if (courses.length > 0) {
          try {
            const assignmentResults = await Promise.all(
              courses.slice(0, 4).map(async (course) => {
                const res = await fetch(
                  `${API_BASE}/api/courses/${course.courseID}/assignments`,
                  {
                    credentials: "include",
                  }
                );
                if (!res.ok) return [];
                const resJson = await res.json();
                const items: RawAssignmentResponse[] = resJson.cleanAssignments || [];
                const courseCode =
                  course.courseDepartment && course.courseCode
                    ? `${course.courseDepartment} ${course.courseCode}`
                    : course.courseCode || course.courseName;

                return items.map((item: RawAssignmentResponse) => ({
                  courseId: course.courseID,
                  courseCode,
                  assignmentName: item.assignmentName || "Assignment",
                  assignmentType: item.assignmentType,
                  assignmentPoints: item.assignmentPoints,
                }));
              })
            );

            if (isMounted) {
              setRealAssignments(assignmentResults.flat());
            }
          } catch (err) {
            console.error("Error loading course assignments:", err);
          }
        }
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

  const courses = dashboardData?.courses || [];
  const gradeMap = new Map<string, string>();
  if (dashboardData?.gradeinfo) {
    for (const g of dashboardData.gradeinfo) {
      if (g.courseID && g.grade) {
        gradeMap.set(String(g.courseID), String(g.grade));
      }
    }
  }

  const primaryTerm = courses.find((c) => c.courseTerm && c.courseTerm.trim().length > 0)?.courseTerm;
  const activeSemester = primaryTerm ? formatSemesterTerm(primaryTerm) : "Fall 2026";
  const enrolledCount = courses.length;

  return (
    <div className="flex flex-col gap-10 p-6 md:p-10 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-foreground">
              {dashboardData?.firstname ? `Welcome back, ${dashboardData.firstname}` : "Overview"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Academic trajectory, grade projection, and active priorities for {activeSemester}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="outline" className="px-3 py-1 text-xs flex items-center gap-1.5">
                <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-3 animate-spin" />
                Loading semester...
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  Semester: {activeSemester}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 text-xs">
                  {enrolledCount > 0 ? `${enrolledCount} Enrolled Courses` : "4 Enrolled Courses"}
                </Badge>
              </>
            )}
          </div>
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

      {isAuthenticated === true && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              strokeWidth={2}
              className="size-4 text-emerald-600 dark:text-emerald-400"
            />
            <span className="font-medium text-foreground">
              Canvas Session Synchronized: {enrolledCount} semester courses active for {dashboardData?.firstname} {dashboardData?.lastname || ""}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {gradeMap.size} grades synced
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 shrink-0" />
          <span>Error connecting to backend: {error}. Showing cached / demo view.</span>
        </div>
      )}

      {/* ACTIVE SEMESTER COURSES SECTION */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Book02Icon}
              strokeWidth={2}
              className="size-5 text-emerald-600 dark:text-emerald-400"
            />
            <h2 className="text-lg font-semibold text-foreground">
              Active Semester Courses
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {activeSemester} • Synced via Canvas
          </span>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const rawGrade = gradeMap.get(String(course.courseID));
              const gradeBadge = formatGradeBadge(rawGrade);
              const courseTag =
                course.courseDepartment && course.courseCode
                  ? `${course.courseDepartment} ${course.courseCode}`
                  : course.courseCode || `Course ${course.courseID}`;

              return (
                <Card
                  key={course.courseID}
                  className="border border-border/80 bg-card p-5 rounded-xl shadow-xs transition-all hover:shadow-md hover:border-emerald-500/30 flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-mono text-xs font-semibold px-2.5 py-0.5">
                        {courseTag}
                      </Badge>
                      {course.courseSection && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Sec {course.courseSection}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                      {course.courseName}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Current Standing
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {gradeBadge.text}
                      </span>
                    </div>
                    <Badge variant={gradeBadge.variant} className="text-[11px] px-2 py-0.5">
                      {course.courseTerm ? formatSemesterTerm(course.courseTerm) : activeSemester}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Card
                key={`course-skeleton-${i}`}
                className="border border-border/70 bg-card/60 p-5 rounded-xl flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                  <Skeleton className="h-4 w-4/5 rounded mt-1" />
                  <Skeleton className="h-4 w-3/5 rounded" />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-3.5 w-12 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

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

        {/* Placeholder Rectangle with live connection indicators */}
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
                  <span><strong>Credit Hours:</strong> Weight per course ({enrolledCount > 0 ? `${enrolledCount} active courses detected` : "e.g. 3 or 4 credits"})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span><strong>Current Class Grades:</strong> {gradeMap.size > 0 ? `${gradeMap.size} in-progress averages synced` : "In-progress weighted averages from Canvas"}</span>
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
            {realAssignments.length > 0 ? "Synced Coursework" : "High Priority"}
          </Badge>
        </div>

        {/* Large Featured Assignment Card */}
        {realAssignments.length > 0 ? (
          <Card className="overflow-hidden border border-border/90 bg-card shadow-lg rounded-2xl transition-all hover:shadow-xl hover:border-emerald-500/30">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs font-semibold px-2.5 py-0.5">
                      {realAssignments[0].courseCode || "Canvas Course"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {realAssignments[0].assignmentType || "Assignment"}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-card-foreground">
                    {realAssignments[0].assignmentName}
                  </h3>
                </div>

                <div className="flex flex-col items-end">
                  <Badge variant="destructive" className="text-xs px-3 py-1 font-semibold">
                    {realAssignments[0].assignmentPoints !== null && realAssignments[0].assignmentPoints !== undefined
                      ? `${realAssignments[0].assignmentPoints} Points Possible`
                      : "Active Priority"}
                  </Badge>
                  <span className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
                    Due this semester
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-card border border-border">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[0.68rem] text-muted-foreground uppercase font-medium">Priority</div>
                    <div className="text-sm font-semibold text-foreground">Action Needed</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-card border border-border">
                    <HugeiconsIcon icon={Task01Icon} strokeWidth={2} className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-[0.68rem] text-muted-foreground uppercase font-medium">Assignment Type</div>
                    <div className="text-sm font-semibold text-foreground">
                      {realAssignments[0].assignmentType || "Coursework"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-card border border-border">
                    <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 text-destructive" />
                  </div>
                  <div>
                    <div className="text-[0.68rem] text-muted-foreground uppercase font-medium">Source</div>
                    <div className="text-sm font-semibold text-foreground">Canvas Live Feed</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-border/90 bg-card shadow-lg rounded-2xl transition-all hover:shadow-xl hover:border-emerald-500/30">
            <div className="p-6 md:p-8 flex flex-col gap-6">
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

              {/* Data requirements callout */}
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
        )}
      </section>

      {/* 3. SUBSEQUENT UPCOMING ASSIGNMENTS */}
      <section className="flex flex-col gap-4 pt-4 pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Subsequent Upcoming Work
          </h2>
          <span className="text-xs text-muted-foreground">
            {realAssignments.length > 1 ? "Live Canvas Queue" : "Canvas Synced Queue"}
          </span>
        </div>

        {realAssignments.length > 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {realAssignments.slice(1, 5).map((asgn, idx) => (
              <Card
                key={`${asgn.courseId}-${idx}`}
                className="border border-border/80 bg-card/60 p-5 rounded-xl hover:bg-card transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary" className="text-[0.68rem]">
                    {asgn.courseCode || "Canvas Course"}
                  </Badge>
                  <Badge variant="outline" className="text-[0.68rem]">
                    {asgn.assignmentPoints !== null && asgn.assignmentPoints !== undefined
                      ? `${asgn.assignmentPoints} Pts`
                      : asgn.assignmentType || "Assignment"}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-card-foreground line-clamp-2">
                  {asgn.assignmentName}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                  <span>Type: {asgn.assignmentType || "Coursework"}</span>
                  <span>Semester Queue</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
