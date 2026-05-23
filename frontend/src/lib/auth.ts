"use client";

import { apiFetch } from "./api";
import {
  clearSessionStorage,
  redirectToLogin,
  handleSessionExpired,
} from "./session";

const TOKEN_KEY = "hub_access_token";
const REFRESH_KEY = "hub_refresh_token";
const USER_KEY = "hub_user";

export type AuthUser = {
  user_id: string;
  email: string;
  full_name?: string;
  role: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(data: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      user_id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    })
  );
}

export function clearAuth() {
  clearSessionStorage();
}

export function logout(options?: { redirect?: boolean; reason?: string }) {
  clearAuth();
  if (options?.redirect === false) return;
  redirectToLogin(options?.reason ?? "logout");
}

export { handleSessionExpired };

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveAuth(data);
  return data;
}

export async function register(
  email: string,
  password: string,
  full_name: string
) {
  const data = await apiFetch<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      full_name,
      role: "inversor",
      preferred_lang: "es",
    }),
  });
  saveAuth(data);
  return data;
}
