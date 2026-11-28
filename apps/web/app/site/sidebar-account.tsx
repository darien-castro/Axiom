"use client";

import { Menu } from "@base-ui/react/menu";
import Image from "next/image";
import { useEffect, useState } from "react";

type Profile = { name: string; avatarUrl: string | null };

function fallbackProfile(): Profile | null {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith("AxiomCookie="))
    ? { name: "Canvas account", avatarUrl: null } : null;
}

export default function SidebarAccount() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let request: AbortController | undefined;

    async function loadProfile() {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const response = await fetch(`/api/me/profile`, { credentials: "include", signal: controller.signal });
        const next = response.ok ? await response.json() as Profile : fallbackProfile();
        if (!controller.signal.aborted) setProfile(next);
      } catch {
        if (!controller.signal.aborted) setProfile(fallbackProfile());
      }
    }

    function refreshProfile() {
      setProfile(null);
      void loadProfile();
    }

    void loadProfile();
    window.addEventListener("axiom-session-change", refreshProfile);
    return () => {
      request?.abort();
      window.removeEventListener("axiom-session-change", refreshProfile);
    };
  }, []);

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/verify`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error();
      window.location.replace("/");
    } catch {
      setError("Couldn’t sign out. Try again.");
      setPending(false);
    }
  }

  if (!profile) return null;

  return <div className="min-w-0">
    <Menu.Root modal={false}>
      <Menu.Trigger aria-label={`Account menu for ${profile.name}`} title={profile.name} disabled={pending}
        className="flex w-full min-w-0 items-center justify-center gap-3 rounded-xl px-1 py-2 text-left text-xs font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring md:justify-start md:px-3">
        <ProfilePhoto key={profile.avatarUrl ?? profile.name} profile={profile} />
        <span className="hidden truncate md:block">{profile.name}</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="right" align="end" sideOffset={24} className="z-50">
          <Menu.Popup className="min-w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <Menu.Item onClick={() => void signOut()}
              className="cursor-default rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted">
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
    {error && <p role="alert" className="mt-1 wrap-anywhere text-xs text-destructive">{error}</p>}
  </div>;
}

function ProfilePhoto({ profile }: { profile: Profile }) {
  const [failed, setFailed] = useState(false);
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();

  return profile.avatarUrl && !failed
    ? <Image src={profile.avatarUrl} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer"
        onError={() => setFailed(true)} className="size-8 shrink-0 rounded-full object-cover" />
    : <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs text-secondary-foreground">{initials}</span>;
}
