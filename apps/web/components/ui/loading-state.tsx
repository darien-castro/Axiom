"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { HashLoader } from "react-spinners";
import { cn } from "@/lib/utils";

const fallbackColor = "#d7827e";

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  return () => observer.disconnect();
}

function getSpinnerColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || fallbackColor;
}

export function LoadingState({ children, className }: { children: ReactNode; className?: string }) {
  const color = useSyncExternalStore(subscribeToTheme, getSpinnerColor, () => fallbackColor);
  return <div role="status" className={cn("flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-4 py-6 text-center text-sm text-muted-foreground", className)}>
    <HashLoader color={color} size={52} speedMultiplier={1.75} aria-hidden="true"
      className="motion-reduce:[&>span]:[animation-play-state:paused]!" />
    <span>{children}</span>
  </div>;
}
