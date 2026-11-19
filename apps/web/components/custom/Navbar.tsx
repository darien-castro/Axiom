import Link from "next/link";

const links = [
  { label: "Sandbox", href: "/mocksite" },
  { label: "Courses", href: "/site/courses?demo=1" },
  { label: "Assignments", href: "/site/assignments?demo=1" },
  { label: "Settings", href: "/site/settings?demo=1" },
];

export default function NavMenu() {
  return <nav aria-label="Axiom demo" className="flex flex-wrap justify-center gap-1">
    {links.map(({ label, href }) => <Link key={href} href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
      {label}
    </Link>)}
  </nav>;
}
