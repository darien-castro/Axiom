import type { ReactNode } from "react";

export default function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {children}
    </header>
  );
}
