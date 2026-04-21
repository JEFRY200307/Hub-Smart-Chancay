'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { useState, useTransition, useRef, useEffect } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locales = [
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'zh', label: '中文', flag: 'ZH' }
  ];

  function onLocaleChange(nextLocale: string) {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Globe Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border shadow-sm ${
          isOpen 
            ? 'bg-red-50 border-red-300 text-red-700' 
            : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-white hover:border-red-400 group'
        }`}
        title="Cambiar idioma / Change language"
      >
        <span className="material-symbols-outlined text-[20px]">public</span>
        <span className="text-[10px] font-black uppercase tracking-tighter">{locale}</span>
        <span className={`material-symbols-outlined text-[14px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="px-3 py-1 mb-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Seleccionar Idioma</span>
          </div>
          {locales.map((item) => (
            <button
              key={item.code}
              onClick={() => onLocaleChange(item.code)}
              className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-red-50 transition-colors group ${
                locale === item.code ? 'text-red-700 bg-red-50/50' : 'text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${locale === item.code ? 'text-red-600' : 'text-slate-400 group-hover:text-red-400'}`}>
                  {item.flag}
                </span>
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              {locale === item.code && (
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
