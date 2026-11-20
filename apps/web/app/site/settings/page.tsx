"use client";

import { Suspense, useState, useRef, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PaintBoardIcon,
  Sun01Icon,
  Moon02Icon,
  Key01Icon,
  ShieldKeyIcon,
  SecurityCheckIcon,
  InformationCircleIcon,
  Delete02Icon,
  AlertCircleIcon,
  Alert02Icon,
  Database01Icon,
  Github01Icon,
  LinkSquare01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Tick02Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dialog } from "@base-ui/react/dialog";
import RelativeDatesSettings from "./relative-dates-settings";
import CourseVisibilitySettings from "./course-visibility-settings";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  THEMES,
  THEME_LIST,
  applyTheme,
  getSavedTheme,
  getSavedDarkMode,
} from "@/lib/themes";

function subscribeStore(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function checkSessionSnapshot() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((row) => row.startsWith("AxiomCookie=") || row.startsWith("session="));
}

export default function SettingsPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading settings…</p>}>
    <SettingsView />
  </Suspense>;
}

function SettingsView() {
  if (useSearchParams().get("demo") === "1") {
    return <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 md:p-10">
      <header className="border-b border-border/60 pb-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Demo mode · Changes are saved in this browser.</p>
      </header>
      <RelativeDatesSettings />
      <CourseVisibilitySettings demo />
    </div>;
  }
  return <CanvasSettings />;
}

function CanvasSettings() {
  const router = useRouter();

  // Hydration & external store sync
  const mounted = useSyncExternalStore(
    subscribeStore,
    () => true,
    () => false
  );

  const selectedTheme = useSyncExternalStore(
    subscribeStore,
    getSavedTheme,
    () => "Rose Pine"
  );

  const isDarkMode = useSyncExternalStore(
    subscribeStore,
    getSavedDarkMode,
    () => false
  );

  const hasActiveSession = useSyncExternalStore(
    subscribeStore,
    checkSessionSnapshot,
    () => false
  );

  // API Key form state
  const [newApiKey, setNewApiKey] = useState<string>("");
  const [keyUpdateStatus, setKeyUpdateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [keyUpdateMessage, setKeyUpdateMessage] = useState<string>("");
  const [courseSessionRevision, setCourseSessionRevision] = useState(0);

  // Modals state
  const [isApiKeyGuideOpen, setIsApiKeyGuideOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // User notification / feedback banner
  const [notification, setNotification] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);

  // Copied state helper
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  // Cancel button ref for Base UI dialog
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const showNotification = (
    type: "success" | "info" | "error",
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId, isDarkMode);
    showNotification("success", `Theme changed to ${THEMES[themeId]?.name || themeId}`);
  };

  const handleModeToggle = (darkMode: boolean) => {
    applyTheme(selectedTheme, darkMode);
    showNotification("info", `Switched to ${darkMode ? "Dark" : "Light"} mode`);
  };

  const handleUpdateApiKey = async () => {
    if (!newApiKey.trim()) return;
    setKeyUpdateStatus("loading");
    setKeyUpdateMessage("");

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });

      if (response.ok) {
        setKeyUpdateStatus("success");
        setKeyUpdateMessage("Canvas API Key verified and session updated!");
        setNewApiKey("");
        setCourseSessionRevision((current) => current + 1);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
        showNotification("success", "Canvas API key rotated and synchronized successfully.");
      } else {
        const errorData = await response.json().catch(() => null);
        setKeyUpdateStatus("error");
        setKeyUpdateMessage(errorData?.error || `Verification failed (HTTP ${response.status})`);
      }
    } catch {
      setKeyUpdateStatus("error");
      setKeyUpdateMessage("Network error: Could not reach backend verification server.");
    }
  };

  const handleClearCacheOnly = () => {
    try {
      const theme = localStorage.getItem("axiom-theme");
      const dark = localStorage.getItem("axiom-dark-mode");

      localStorage.clear();

      if (theme) localStorage.setItem("axiom-theme", theme);
      if (dark) localStorage.setItem("axiom-dark-mode", dark);

      sessionStorage.clear();
      showNotification("success", "Cached coursework, grades, and focus list data cleared.");
    } catch {
      showNotification("error", "Failed to clear cache.");
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      document.cookie = "AxiomCookie=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      localStorage.clear();
      sessionStorage.clear();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setIsDeleteModalOpen(false);
      setIsDeleting(false);

      showNotification("info", "All data deleted. Redirecting to landing page...");
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch {
      setIsDeleting(false);
      showNotification("error", "An error occurred while deleting data.");
    }
  };

  const handleCopyText = (text: string, stepId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
    }
  };

  const activeThemeMeta = THEMES[selectedTheme] || THEMES["Rose Pine"];

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto text-foreground">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure appearance themes, Canvas LMS credentials, storage, and application preferences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              Axiom v0.1.0
            </Badge>
            <Badge
              variant={hasActiveSession ? "default" : "secondary"}
              className="px-3 py-1 text-xs flex items-center gap-1.5"
            >
              <span
                className={`size-2 rounded-full ${
                  hasActiveSession ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/60"
                }`}
              />
              {hasActiveSession ? "Canvas Connected" : "Session Inactive"}
            </Badge>
          </div>
        </div>
        <Separator className="mt-3 bg-border/60" />
      </div>

      {/* Dynamic Feedback Banner */}
      {notification && (
        <div
          className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 text-xs transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2 ${
            notification.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : notification.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={
                notification.type === "success"
                  ? CheckmarkCircle02Icon
                  : notification.type === "error"
                  ? Alert02Icon
                  : InformationCircleIcon
              }
              strokeWidth={2}
              className="size-4 shrink-0"
            />
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <RelativeDatesSettings />
      <CourseVisibilitySettings key={courseSessionRevision} />

      {/* 2x2 Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 1. Theme Change Dropdown & Appearance */}
        <Card className="rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Appearance & Theme</CardTitle>
                    <CardDescription>Customize Axiom&apos;s workspace palette and color mode</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-1">
              {/* Palette Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="theme-select" className="text-xs font-medium text-foreground">
                  Theme Palette
                </Label>
                {mounted ? (
                  <Select
                    value={selectedTheme}
                    onValueChange={(val) => {
                      if (val) handleThemeChange(val as string);
                    }}
                  >
                    <SelectTrigger id="theme-select" className="w-full h-9 rounded-xl border-border bg-muted/20 px-3">
                      <SelectValue placeholder="Choose a theme palette...">
                        {(val: unknown) => {
                          const currentKey = (typeof val === "string" ? val : selectedTheme) || "Rose Pine";
                          const theme = THEMES[currentKey] || THEMES["Rose Pine"];
                          return (
                            <div className="flex items-center gap-2.5 truncate">
                              <span
                                className="size-3.5 rounded-full border border-border/80 shrink-0"
                                style={{ backgroundColor: theme.swatch.primary }}
                              />
                              <span className="font-medium text-foreground">{theme.name}</span>
                              <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
                                — {theme.description}
                              </span>
                            </div>
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                      {THEME_LIST.map((theme) => (
                        <SelectItem
                          key={theme.id}
                          value={theme.id}
                          className="rounded-lg py-2 cursor-pointer hover:bg-muted/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="size-3.5 rounded-full border border-border/80 shrink-0 shadow-xs"
                              style={{ backgroundColor: theme.swatch.primary }}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{theme.name}</span>
                              <span className="text-[10px] text-muted-foreground">{theme.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-9 w-full rounded-xl border border-border bg-muted/20" />
                )}
              </div>

              {/* Mode Toggle (Light / Dark) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Interface Mode</Label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-border bg-muted/20">
                  <button
                    type="button"
                    onClick={() => handleModeToggle(false)}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                      !isDarkMode
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} className="size-4 text-amber-500" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeToggle(true)}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isDarkMode
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className="size-4 text-primary" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Live Palette Swatches Preview */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Current Palette Swatch</span>
                  <span className="font-mono text-[10px] uppercase">{selectedTheme}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1 items-center">
                    <span
                      className="size-7 rounded-lg border border-border/80 shadow-xs"
                      style={{ backgroundColor: activeThemeMeta.swatch.primary }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">Primary</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <span
                      className="size-7 rounded-lg border border-border/80 shadow-xs"
                      style={{ backgroundColor: activeThemeMeta.swatch.background }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">Backdrop</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <span
                      className="size-7 rounded-lg border border-border/80 shadow-xs"
                      style={{ backgroundColor: activeThemeMeta.swatch.card }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">Card</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <span
                      className="size-7 rounded-lg border border-border/80 shadow-xs"
                      style={{ backgroundColor: activeThemeMeta.swatch.accent }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">Accent</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Theme auto-saves to your local browser</span>
            <span className="font-medium text-primary">Live updated</span>
          </CardFooter>
        </Card>

        {/* 2. Canvas LMS API Key & Instructions Popup */}
        <Card className="rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Canvas API Key</CardTitle>
                    <CardDescription>Manage credentials connecting Axiom to Canvas LMS</CardDescription>
                  </div>
                </div>
                <Badge
                  variant={hasActiveSession ? "default" : "outline"}
                  className="text-[11px] font-mono"
                >
                  {hasActiveSession ? "Active" : "Unconnected"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-1">
              {/* Quick instructions & popup modal trigger */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    strokeWidth={2}
                    className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                  />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xs font-semibold text-foreground">
                      How to Revoke or Generate Tokens
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Need a new token or want to invalidate an old one? View our step-by-step visual popup guide.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsApiKeyGuideOpen(true)}
                  className="w-full rounded-xl h-8 text-xs font-medium border-border/80 bg-card hover:bg-muted/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-3.5" />
                  <span>Open API Key Guide & Revoke Steps</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5 ml-0.5" />
                </Button>
              </div>

              {/* Quick Key Rotation / Update */}
              <div className="space-y-2">
                <Label htmlFor="rotate-token-input" className="text-xs font-medium text-foreground">
                  Update / Connect Canvas Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="rotate-token-input"
                    type="password"
                    placeholder="Paste Canvas token (e.g. 7~...)"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    className="h-9 rounded-xl border-border bg-muted/20 text-xs px-3 focus-visible:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateApiKey();
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleUpdateApiKey}
                    disabled={!newApiKey.trim() || keyUpdateStatus === "loading"}
                    className="h-9 rounded-xl px-4 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 cursor-pointer"
                  >
                    {keyUpdateStatus === "loading" ? "Verifying..." : "Update Key"}
                  </Button>
                </div>
                {keyUpdateMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      keyUpdateStatus === "success"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    {keyUpdateMessage}
                  </p>
                )}
              </div>

              {/* Security info card */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card border border-border/60 text-[11px] text-muted-foreground">
                <HugeiconsIcon
                  icon={SecurityCheckIcon}
                  strokeWidth={2}
                  className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                />
                <span>Stored using AES-256-GCM encryption with HMAC-SHA256 indexing.</span>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Canvas Token Security</span>
            <span className="font-mono text-[10px]">End-to-end encrypted</span>
          </CardFooter>
        </Card>

        {/* 3. Delete Data (Danger Zone) */}
        <Card className="rounded-2xl border border-destructive/30 bg-card/60 backdrop-blur-md shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-destructive/10 p-2 text-destructive">
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Data & Storage</CardTitle>
                    <CardDescription>Manage local cache, session cookies, and stored student data</CardDescription>
                  </div>
                </div>
                <Badge variant="destructive" className="text-[11px] font-mono">
                  Danger Zone
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Axiom stores cached coursework and local configuration to improve performance. You can selectively
                purge temporary coursework cache, or permanently wipe all session credentials and reset the workspace.
              </p>

              {/* Storage Items Overview */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-border/80 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HugeiconsIcon icon={Database01Icon} strokeWidth={2} className="size-3.5" />
                    <span className="text-[10px] uppercase font-semibold">Session Cookie</span>
                  </div>
                  <p className="font-medium text-foreground">
                    {hasActiveSession ? "Active AxiomCookie" : "None Detected"}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/80 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} className="size-3.5" />
                    <span className="text-[10px] uppercase font-semibold">Preferences</span>
                  </div>
                  <p className="font-medium text-foreground">{selectedTheme} · Local</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCacheOnly}
                  className="rounded-xl h-9 text-xs font-medium border-border/80 bg-card hover:bg-muted/30 cursor-pointer flex-1 flex items-center justify-center gap-1.5"
                >
                  <HugeiconsIcon icon={ReloadIcon} strokeWidth={2} className="size-3.5" />
                  <span>Clear Course Cache Only</span>
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-xl h-9 text-xs font-medium cursor-pointer flex-1 flex items-center justify-center gap-1.5"
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                  <span>Delete All Data</span>
                </Button>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Permanently wipe browser storage & credentials</span>
            <span className="text-destructive font-medium">Irreversible</span>
          </CardFooter>
        </Card>

        {/* 4. GitHub & Open Source Information */}
        <Card className="rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-slate-500/10 p-2 text-foreground">
                    <HugeiconsIcon icon={Github01Icon} strokeWidth={2} className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">GitHub Repository</CardTitle>
                    <CardDescription>Open-source project, architecture docs, and contributions</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  MIT License
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground">darien-castro/Axiom</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Public Repo</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Axiom is built for students to calculate weighted assignment urgency, projected GPA, and Monte Carlo
                  risk simulations. Join us on GitHub to submit pull requests, inspect architecture, or report issues.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="rounded-md bg-muted/50 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    Next.js 16
                  </span>
                  <span className="rounded-md bg-muted/50 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    React 19
                  </span>
                  <span className="rounded-md bg-muted/50 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    Tailwind v4
                  </span>
                  <span className="rounded-md bg-muted/50 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    C++ N-API
                  </span>
                </div>
              </div>

              {/* GitHub Link Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href="https://github.com/darien-castro/Axiom/tree/dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl h-9 text-xs font-medium border-border/80 bg-card hover:bg-muted/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HugeiconsIcon icon={Github01Icon} strokeWidth={2} className="size-3.5" />
                    <span>View Repository</span>
                    <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
                  </Button>
                </a>

                <a
                  href="https://github.com/darien-castro/Axiom/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl h-9 text-xs font-medium border-border/80 bg-card hover:bg-muted/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5" />
                    <span>Report an Issue</span>
                    <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Free and open-source software</span>
            <span className="font-mono text-[10px]">https://github.com/darien-castro/Axiom/tree/dev</span>
          </CardFooter>
        </Card>
      </div>

      {/* POPUP MODAL 1: How to Revoke / Create API Key Guide */}
      <Dialog.Root open={isApiKeyGuideOpen} onOpenChange={setIsApiKeyGuideOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 md:p-8 text-card-foreground shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                  <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-5" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold tracking-tight text-foreground">
                    Canvas LMS API Key Guide
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-muted-foreground">
                    Instructions for creating, rotating, and revoking your Canvas Personal Access Token
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                ✕
              </Dialog.Close>
            </div>

            <div className="space-y-6 pt-5">
              {/* Part 1: How to Generate */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    1
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">How to Generate a New Access Token</h3>
                </div>
                <div className="space-y-2.5 text-xs text-muted-foreground pl-8">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step A:</span>
                    <span>
                      Open your university Canvas portal (e.g.{" "}
                      <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">
                        canvas.charlotte.edu
                      </code>
                      ) and log in.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step B:</span>
                    <span>
                      In the left navigation bar, click on your profile icon (<strong>Account</strong>) and select{" "}
                      <strong>Settings</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step C:</span>
                    <span>
                      Scroll down to the <strong>Approved Integrations</strong> section near the bottom.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step D:</span>
                    <span>
                      Click the <strong>+ New Access Token</strong> button.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step E:</span>
                    <span>
                      In the prompt, set <em>Purpose</em> to <code>Axiom</code> and optionally specify an expiration
                      date.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step F:</span>
                    <span>
                      Click <strong>Generate Token</strong>. Copy the token string immediately! Canvas only displays it
                      once.
                    </span>
                  </div>
                </div>

                {/* Helpful copyable snippet */}
                <div className="ml-8 mt-2 flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Suggested Purpose</span>
                    <p className="font-mono text-xs font-semibold text-foreground">Axiom</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyText("Axiom", "purpose")}
                    className="h-7 text-[11px] gap-1 cursor-pointer"
                  >
                    <HugeiconsIcon icon={copiedStep === "purpose" ? Tick02Icon : Copy01Icon} strokeWidth={2} className="size-3" />
                    <span>{copiedStep === "purpose" ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Part 2: How to Revoke */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-destructive/10 text-destructive font-bold text-xs">
                    2
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">How to Revoke an Existing Token</h3>
                </div>
                <div className="space-y-2.5 text-xs text-muted-foreground pl-8">
                  <p>
                    If you ever lose access to your device or want to remove Axiom&apos;s permission, you can revoke the token directly inside Canvas:
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step 1:</span>
                    <span>
                      Return to Canvas &rarr; <strong>Account</strong> &rarr; <strong>Settings</strong> &rarr;{" "}
                      <strong>Approved Integrations</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step 2:</span>
                    <span>
                      Find the token entry labeled <strong>Axiom</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Step 3:</span>
                    <span>
                      Click the <strong>Trash Can (Delete)</strong> icon on the right side of the token row and confirm.
                    </span>
                  </div>
                  <p className="text-[11px] text-destructive/90 pt-1">
                    Revoking in Canvas immediately disables all API calls and severs Axiom&apos;s connection.
                  </p>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Part 3: Privacy & Security */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3 text-xs">
                <HugeiconsIcon
                  icon={ShieldKeyIcon}
                  strokeWidth={2}
                  className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">Your Credentials Remain Private</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Axiom only reads course, grade, and assignment data. Tokens are stored encrypted with AES-256-GCM.
                    You can revoke access at any time directly through Canvas LMS.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/60">
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="default"
                    className="rounded-xl px-5 h-9 text-xs font-semibold bg-primary text-primary-foreground cursor-pointer"
                  />
                }
              >
                Done
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* POPUP MODAL 2: Delete Data Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Popup
            initialFocus={cancelDeleteRef}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-destructive/40 bg-card p-6 md:p-7 text-card-foreground shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-destructive/15 p-3 text-destructive shrink-0">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-6" />
              </div>
              <div className="space-y-1">
                <Dialog.Title className="text-base font-bold tracking-tight text-foreground">
                  Permanently Delete All Data?
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground leading-relaxed">
                  This action will clear all local storage, purge cached coursework and grades, erase active Canvas
                  session cookies, and sign you out immediately.
                </Dialog.Description>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span className="size-1.5 rounded-full bg-destructive" />
                <span>What will be cleared:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px]">
                <li>Active Canvas session cookie (<code>AxiomCookie</code>)</li>
                <li>Cached assignments, course weights & grades</li>
                <li>Saved Focus assignments list & theme preferences</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 pt-3 border-t border-border/60">
              <Dialog.Close
                render={
                  <Button
                    ref={cancelDeleteRef}
                    type="button"
                    variant="outline"
                    disabled={isDeleting}
                    className="h-9 rounded-xl px-4 text-xs font-medium border-border/80 cursor-pointer"
                  />
                }
              >
                Cancel
              </Dialog.Close>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleConfirmDeleteAll}
                className="h-9 rounded-xl px-4 text-xs font-semibold cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
