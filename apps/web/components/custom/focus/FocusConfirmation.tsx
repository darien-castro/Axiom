"use client";

import { useRef, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import type { FocusAssignment } from "@/lib/focus-types";

export default function FocusConfirmation({ assignment, returnFocus, onCancel, onConfirm }: {
  assignment: FocusAssignment | null;
  returnFocus: RefObject<HTMLElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelButton = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root open={assignment !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20" />
        <Dialog.Popup initialFocus={cancelButton} finalFocus={returnFocus}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
          <Dialog.Title className="text-lg font-semibold tracking-tight">Add this assignment to My Focus List?</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {assignment?.title}
          </Dialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close render={<Button ref={cancelButton} type="button" variant="outline" className="h-9 rounded-lg px-4" />}>Cancel</Dialog.Close>
            <Button type="button" onClick={onConfirm} className="h-9 rounded-lg bg-emerald-700 px-4 text-white hover:bg-emerald-800">Add to Focus</Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
