import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { FocusAssignment } from "@/lib/focus-types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", hour: "numeric",
  minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short",
});

export default function AssignmentFocusCard({ assignment }: { assignment: FocusAssignment }) {
  const hours = Math.floor(assignment.estimatedMinutes / 60);
  const minutes = assignment.estimatedMinutes % 60;
  const effort = [hours ? `${hours} hr` : "", minutes ? `${minutes} min` : ""].filter(Boolean).join(" ");

  return (
    <Card className="gap-4 rounded-2xl border-border/80 bg-card p-5 shadow-xs md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">{assignment.courseCode}</Badge>
            <span className="text-xs text-muted-foreground">{assignment.courseName}</span>
          </div>
          <h3 className="text-base font-semibold tracking-tight text-card-foreground">{assignment.title}</h3>
        </div>
        <Badge variant={assignment.demoImportance === "high" ? "destructive" : "outline"} className="capitalize">
          {assignment.demoImportance} importance · Demo-derived
        </Badge>
      </div>
      <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-muted-foreground">Assignment type</dt><dd className="mt-1 font-medium">{assignment.type}</dd></div>
        <div><dt className="text-muted-foreground">Points possible</dt><dd className="mt-1 font-medium">{assignment.pointsPossible} pts</dd></div>
        <div><dt className="text-muted-foreground">Estimated effort</dt><dd className="mt-1 font-medium">{effort}{assignment.type === "Major assessment" ? " (including preparation)" : ""}</dd></div>
        <div><dt className="text-muted-foreground">Due</dt><dd className="mt-1 font-medium"><time dateTime={assignment.dueAt}>{dateFormatter.format(new Date(assignment.dueAt))}</time></dd></div>
      </dl>
      {assignment.availableUntil && <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">Available until <time dateTime={assignment.availableUntil}>{dateFormatter.format(new Date(assignment.availableUntil))}</time></p>}
    </Card>
  );
}
