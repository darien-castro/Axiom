import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingState({ children, className }: { children: ReactNode; className?: string }) {
  return <div role="status" className={cn("flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-4 py-6 text-center text-sm text-muted-foreground", className)}>
    <span aria-hidden="true" className="size-9 rounded-full border-[3px] border-primary/20 border-t-primary motion-safe:animate-spin" />
    <span>{children}</span>
  </div>;
}
