import { useSyncExternalStore } from "react";

export const nextUpFilters = { "for-you": "For You", deadline: "Due date", "grade-weight": "Grade weight" };
export type NextUpFilter = keyof typeof nextUpFilters;
export function isNextUpFilter(value: string | null): value is NextUpFilter {
  return value !== null && Object.hasOwn(nextUpFilters, value);
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
export function useDashboardPreference(key: string, fallback: string) {
  return useSyncExternalStore(subscribe, () => localStorage.getItem(key) ?? fallback, () => fallback);
}
export function saveDashboardPreference(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("storage"));
}
export function useNextUpFilter(): NextUpFilter {
  const value = useDashboardPreference("axiom.nextUp", "for-you");
  return isNextUpFilter(value) ? value : "for-you";
}
