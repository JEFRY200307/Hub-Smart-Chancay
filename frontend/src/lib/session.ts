"use client";

import { clearFlow } from "./flow";

const TOKEN_KEY = "hub_access_token";
const REFRESH_KEY = "hub_refresh_token";
const USER_KEY = "hub_user";

export function clearSessionStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  clearFlow();
}

export function redirectToLogin(reason?: string) {
  if (typeof window === "undefined") return;
  const parts = window.location.pathname.split("/").filter(Boolean);
  const locale = ["es", "en", "zh"].includes(parts[0] ?? "") ? parts[0] : "es";
  const params = new URLSearchParams();
  if (reason) params.set("reason", reason);
  const q = params.toString();
  window.location.href = `/${locale}/login${q ? `?${q}` : ""}`;
}

export function handleSessionExpired() {
  clearSessionStorage();
  redirectToLogin("expired");
}
