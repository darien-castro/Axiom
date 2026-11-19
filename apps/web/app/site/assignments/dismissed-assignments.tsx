"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { assignmentIdentity, type DismissedAssignment } from "@/lib/course-workload";

export default function DismissedAssignments({ assignments, saving, error, onRestore }: {
  assignments: DismissedAssignment[];
  saving: ReadonlySet<string>;
  error: string | null;
  onRestore: (courseId: string, assignmentId: string) => void;
}) {
  return <Dialog.Root>
    <Dialog.Trigger render={<Button type="button" variant="outline" size="icon-lg" className="size-9"
      aria-label="Dismissed assignments" title="Dismissed assignments" />}>
      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-[18px]" aria-hidden="true" />
    </Dialog.Trigger>

    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs data-closed:hidden" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(36rem,85dvh)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl data-closed:hidden">
        <div className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <Dialog.Title className="text-lg font-semibold tracking-tight">Dismissed assignments</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">Restore any assignments you want back in your list.</Dialog.Description>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
          {error && <p role="alert" className="py-2 text-sm text-destructive">{error}</p>}
          {assignments.length > 0 ? <ul className="divide-y divide-border">
            {assignments.map(({ assignmentId, assignmentName, courseId, courseName }) => {
              const key = assignmentIdentity(courseId, assignmentId);
              const pending = saving.has(key);
              return <li key={key} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="wrap-anywhere text-sm font-medium">{assignmentName}</p>
                  <p className="wrap-anywhere text-xs text-muted-foreground">{courseName}</p>
                </div>
                <Button type="button" variant="outline" size="lg" disabled={pending}
                  aria-label={"Restore " + assignmentName} onClick={() => onRestore(courseId, assignmentId)}>
                  {pending ? "Restoring…" : "Restore"}
                </Button>
              </li>;
            })}
          </ul> : <p className="py-5 text-sm text-muted-foreground">No dismissed assignments. You can dismiss assignments by right-clicking them. </p>}
        </div>
        <div className="flex shrink-0 justify-end border-t border-border px-5 py-3 sm:px-6">
          <Dialog.Close render={<Button type="button" size="lg" className="min-w-16" />}>Done</Dialog.Close>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
