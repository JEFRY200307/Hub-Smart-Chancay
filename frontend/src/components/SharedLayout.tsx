"use client";

import { Link } from "@/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "./LocaleSwitcher";
import BrandLogo from "./BrandLogo";
import AuthNavButton from "./AuthNavButton";

const HEADER_H = 72;
const SIDEBAR_EXPANDED = 256;
const SIDEBAR_COLLAPSED = 72;
const STORAGE_KEY = "comex-sidebar-collapsed";

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

function shellStyle(sidebarW: number): React.CSSProperties {
  return {
    ["--header-h" as string]: `${HEADER_H}px`,
    ["--sidebar-w" as string]: `${sidebarW}px`,
  };
}

function SidebarLink({
  href,
  icon,
  label,
  collapsed,
  onNavigate,
}: NavItem & { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`group flex items-center rounded-lg mx-2 py-2.5 text-slate-700 hover:bg-slate-100 hover:text-[#E31E24] transition-colors ${
        collapsed ? "justify-center px-2" : "gap-3 px-4"
      }`}
    >
      <span className="material-symbols-outlined text-[22px] shrink-0 text-slate-600 group-hover:text-[#E31E24]">
        {icon}
      </span>
      {!collapsed && (
        <span className="text-xs font-bold uppercase tracking-wide leading-snug">
          {label}
        </span>
      )}
    </Link>
  );
}

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Navigation");
  const c = useTranslations("Common");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const style = shellStyle(sidebarW);

  const mainNav: NavItem[] = [
    { href: "/dashboard", icon: "dashboard", label: t("dashboard") },
    { href: "/dashboard/portfolio", icon: "folder_open", label: "Portafolio" },
    { href: "/simulacion", icon: "analytics", label: "Simulación ZEEP" },
    { href: "/", icon: "location_on", label: t("benefits") },
    { href: "/operators", icon: "anchor", label: t("port") },
    { href: "/match", icon: "handshake", label: t("match") },
    { href: "/onboarding", icon: "assignment", label: "Onboarding" },
    { href: "/dashboard/validator", icon: "verified", label: "Ledger" },
    { href: "/dashboard/concierge", icon: "groups", label: "Concierge" },
    { href: "/legal-ai", icon: "gavel", label: t("legalAi") },
    { href: "/services", icon: "business_center", label: t("services") },
  ];

  const topNavLinks = (
    <>
      <Link
        href="/"
        className="text-slate-700 hover:text-[#E31E24] transition-colors whitespace-nowrap"
      >
        {t("benefits")}
      </Link>
      <Link
        href="/operators"
        className="text-slate-700 hover:text-[#E31E24] transition-colors whitespace-nowrap"
      >
        {t("port")}
      </Link>
      <Link
        href="/simulacion"
        className="text-slate-700 hover:text-[#E31E24] transition-colors whitespace-nowrap"
      >
        Simulación
      </Link>
      <Link
        href="/match"
        className="text-slate-700 hover:text-[#E31E24] transition-colors whitespace-nowrap"
      >
        {t("match")}
      </Link>
      <Link
        href="/legal-ai"
        className="text-slate-700 hover:text-[#E31E24] transition-colors whitespace-nowrap"
      >
        {t("legalAi")}
      </Link>
      <Link
        href="/services"
        className="text-slate-700 hover:text-[#E31E24] transition-colors whitespace-nowrap"
      >
        {t("services")}
      </Link>
    </>
  );

  const sidebarContent = (opts: {
    collapsed: boolean;
    onNavigate?: () => void;
    showBrandHeader?: boolean;
  }) => (
    <>
      {opts.showBrandHeader !== false && (
        <div
          className={`flex items-center border-b border-slate-200/80 shrink-0 ${
            opts.collapsed ? "flex-col gap-2 py-3 px-2" : "justify-between gap-2 py-4 px-3"
          }`}
        >
          {!opts.collapsed && (
            <div className="min-w-0 flex-1 pl-1">
              <BrandLogo href="/" height={26} />
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-2 leading-tight">
                {c("subtitle")}
              </p>
            </div>
          )}
          {opts.collapsed && <BrandLogo href="/" height={24} />}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-[#E31E24]/10 hover:text-[#E31E24] hover:border-[#E31E24]/30 transition-colors shrink-0"
            aria-label={opts.collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            title={opts.collapsed ? "Expandir menú" : "Contraer menú"}
          >
            <span className="material-symbols-outlined text-xl">
              {opts.collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5">
        {mainNav.map((item) => (
          <SidebarLink
            key={`${item.href}-${item.label}`}
            {...item}
            collapsed={opts.collapsed}
            onNavigate={opts.onNavigate}
          />
        ))}
      </nav>

      <div
        className={`shrink-0 border-t border-slate-200/80 py-3 space-y-0.5 ${
          opts.collapsed ? "px-1" : "px-2"
        }`}
      >
        <SidebarLink
          href="#"
          icon="settings"
          label="Settings"
          collapsed={opts.collapsed}
          onNavigate={opts.onNavigate}
        />
        <SidebarLink
          href="#"
          icon="help_outline"
          label="Support"
          collapsed={opts.collapsed}
          onNavigate={opts.onNavigate}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface" style={hydrated ? style : shellStyle(SIDEBAR_EXPANDED)}>
      {/* Barra superior */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-[var(--header-h)] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-sm"
        style={hydrated ? style : undefined}
      >
        <div
          className="flex min-w-0 flex-1 items-center gap-3 lg:gap-6 transition-[padding] duration-300 ease-in-out lg:pl-[var(--sidebar-w)]"
        >
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <BrandLogo href="/" height={30} priority className="shrink-0" />
          <nav className="hidden xl:flex items-center gap-5 text-[12px] font-semibold uppercase tracking-wider overflow-x-auto">
            {topNavLinks}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <LocaleSwitcher />
          <span className="material-symbols-outlined hidden sm:inline text-slate-600 cursor-pointer hover:bg-slate-100 p-2 rounded-full">
            notifications
          </span>
          <span className="material-symbols-outlined hidden sm:inline text-slate-600 cursor-pointer hover:bg-slate-100 p-2 rounded-full">
            account_circle
          </span>
          <AuthNavButton loginLabel={c("login")} logoutLabel={c("logout")} />
        </div>
      </header>

      {/* Sidebar escritorio */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-[var(--header-h)] z-40 h-[calc(100vh-var(--header-h))] bg-white border-r border-slate-200/80 shadow-sm transition-[width] duration-300 ease-in-out overflow-hidden"
        style={{ width: hydrated ? sidebarW : SIDEBAR_EXPANDED }}
      >
        {sidebarContent({ collapsed })}
      </aside>

      {/* Sidebar móvil (overlay) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menú"
            onClick={closeMobile}
          />
          <aside className="relative flex flex-col w-[min(280px,85vw)] max-w-full h-full bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <BrandLogo href="/" height={28} />
              <button
                type="button"
                onClick={closeMobile}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700"
                aria-label="Cerrar menú"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {sidebarContent({
                collapsed: false,
                onNavigate: closeMobile,
                showBrandHeader: false,
              })}
            </div>
          </aside>
        </div>
      )}

      {/* Contenido principal — respeta header + sidebar */}
      <main
        className="min-h-screen w-full max-w-full overflow-x-hidden pt-[var(--header-h)] transition-[padding] duration-300 ease-in-out lg:pl-[var(--sidebar-w)]"
        style={hydrated ? style : shellStyle(SIDEBAR_EXPANDED)}
      >
        {children}
      </main>
    </div>
  );
}
