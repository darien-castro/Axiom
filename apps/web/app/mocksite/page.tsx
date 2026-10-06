export default function Page() {
  return (
    <div className="flex w-full h-fit  gap-6 bg-white">
      <div className="min-h-[300px] rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-card-foreground">Courses</h3>
        <p className="text-sm text-muted-foreground mt-1">Active enrollments & grades</p>
      </div>
      <div className="min-h-[300px] rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-card-foreground">Assignments</h3>
        <p className="text-sm text-muted-foreground mt-1">Upcoming deadlines & submissions</p>
      </div>
      <div className="min-h-[300px] rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-card-foreground">Analytics</h3>
        <p className="text-sm text-muted-foreground mt-1">Progress and projections</p>
      </div>
    </div>
  );
}
