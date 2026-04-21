'use client';
import { Link } from "@/navigation";
import React from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import LocaleSwitcher from "./LocaleSwitcher";

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Navigation');
  const c = useTranslations('Common');

  return (
    <div className="flex bg-surface min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-4 max-w-full mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 shadow-sm dark:shadow-none border-b border-slate-200/20">
        <div className="flex items-center gap-8 lg:ml-64">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 relative flex-shrink-0">
              <Image 
                src="/logo-cip.png" 
                alt="Logo CIP" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tighter text-slate-800 dark:text-white">
              {c('title')}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold uppercase tracking-wider">
            <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-500 transition-colors">
              {t('benefits')}
            </Link>
            <Link href="/operators" className="text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-500 transition-colors">
              {t('port')}
            </Link>
            <Link href="/dashboard/match" className="text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-500 transition-colors">
              {t('match')}
            </Link>
            <Link href="/dashboard/legal-ai" className="text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-500 transition-colors">
              {t('legalAi')}
            </Link>
            <Link href="/services" className="text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-500 transition-colors">
              {t('services')}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <LocaleSwitcher />
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-600 cursor-pointer hover:bg-slate-100/50 p-2 rounded-full transition-all">notifications</span>
            <span className="material-symbols-outlined text-slate-600 cursor-pointer hover:bg-slate-100/50 p-2 rounded-full transition-all">account_circle</span>
          </div>
          <Link href="/login" className="bg-[#b91c1c] text-white px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-transform inline-block">
            {c('login')}
          </Link>
        </div>
      </nav>

      {/* Side Navigation Bar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full py-8 w-64 bg-white dark:bg-slate-950 border-r border-slate-200/30 z-40 mt-[72px]">
        <div className="px-6 mb-8">
          <h2 className="text-lg font-black text-[#a51c1c] uppercase tracking-tighter">{c('title')}</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-tight mt-1">{c('subtitle')}</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-red-700 hover:translate-x-1 transition-all">
            <span className="material-symbols-outlined text-[20px]" data-icon="dashboard">dashboard</span>
            <span className="text-xs font-bold uppercase tracking-widest">{t('dashboard')}</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-red-700 hover:translate-x-1 transition-all">
            <span className="material-symbols-outlined text-[20px]" data-icon="location_on">location_on</span>
            <span className="text-xs font-bold uppercase tracking-widest">{t('benefits')}</span>
          </Link>
          <Link href="/operators" className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-red-700 hover:translate-x-1 transition-all">
            <span className="material-symbols-outlined text-[20px]" data-icon="anchor">anchor</span>
            <span className="text-xs font-bold uppercase tracking-widest">{t('port')}</span>
          </Link>
          <Link href="/dashboard/match" className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-red-700 hover:translate-x-1 transition-all">
            <span className="material-symbols-outlined text-[20px]" data-icon="handshake">handshake</span>
            <span className="text-xs font-bold uppercase tracking-widest">{t('match')}</span>
          </Link>
          <Link href="/dashboard/legal-ai" className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-red-700 hover:translate-x-1 transition-all">
            <span className="material-symbols-outlined text-[20px]" data-icon="gavel">gavel</span>
            <span className="text-xs font-bold uppercase tracking-widest">{t('legalAi')}</span>
          </Link>
          <Link href="/services" className="flex items-center gap-3 px-6 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-red-700 hover:translate-x-1 transition-all">
            <span className="material-symbols-outlined text-[20px]" data-icon="business_center">business_center</span>
            <span className="text-xs font-bold uppercase tracking-widest">{t('services')}</span>
          </Link>
        </nav>
        <div className="mt-auto px-6 space-y-1 border-t border-slate-200/10 pt-4">
          <Link href="#" className="flex items-center gap-3 py-2 text-slate-500 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-sm" data-icon="settings">settings</span>
            <span className="text-xs uppercase tracking-widest font-label">Settings</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 py-2 text-slate-500 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-sm" data-icon="help_outline">help_outline</span>
            <span className="text-xs uppercase tracking-widest font-label">Support</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
