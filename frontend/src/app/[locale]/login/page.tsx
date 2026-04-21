import React from 'react';
import Image from 'next/image';
import { Link } from "@/navigation";
import { getTranslations } from 'next-intl/server';
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Login' });
  const c = await getTranslations({ locale, namespace: 'Common' });

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-white/5 backdrop-blur-md">
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
          <div className="text-xl font-black tracking-tighter text-slate-800 font-headline uppercase italic">
            {c('title')}
          </div>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <LocaleSwitcher />
        </div>
      </nav>

      <main className="flex-grow flex items-stretch min-h-screen">
        {/* Visual Anchor */}
        <section className="hidden lg:flex w-1/2 relative items-end p-16" style={{ backgroundImage: "linear-gradient(to top, rgba(165, 28, 28, 0.95), rgba(165, 28, 28, 0.4)), url('https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="relative z-10 max-w-xl">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block italic">{t('institutionalInfrastructure')}</span>
            <h1 className="text-white font-headline text-6xl font-black tracking-tighter mb-6 leading-[0.9] uppercase italic">
              {t('visualTitle')}
            </h1>
            <p className="text-red-100 text-lg leading-relaxed mb-8 font-bold uppercase tracking-wide opacity-80">
              {t('visualSubtitle')}
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-sm border border-white/10 shadow-2xl">
                <div className="text-white font-black text-3xl font-headline tracking-tighter">40m+</div>
                <div className="text-red-100 text-[9px] font-bold uppercase tracking-[0.2em]">{t('teuCapacity')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-sm border border-white/10 shadow-2xl">
                <div className="text-white font-black text-3xl font-headline tracking-tighter">16.5m</div>
                <div className="text-red-100 text-[9px] font-bold uppercase tracking-[0.2em]">{t('draftDepth')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Access Portal */}
        <section className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-24 bg-white relative">
          <div className="w-full max-w-md">
            <div className="mb-12">
              <h2 className="text-[#a51c1c] font-headline text-4xl font-black mb-2 tracking-tighter uppercase italic">{t('accessTitle')}</h2>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider italic">{t('accessSubtitle')}</p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">{t('corporateRuc')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">corporate_fare</span>
                  <input className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 focus:border-red-600 rounded-sm text-slate-900 outline-none transition-all font-bold placeholder:text-slate-300" placeholder="20XXXXXXXXX" type="text" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{t('password')}</label>
                  <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-red-700 hover:underline transition-all italic">{t('forgotPassword')}</Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">lock</span>
                  <input className="w-full pl-12 pr-12 py-5 bg-slate-50 border border-slate-200 focus:border-red-600 rounded-sm text-slate-900 outline-none transition-all font-bold placeholder:text-slate-300" placeholder="••••••••••••" type="password" />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-700 transition-colors" type="button">
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </div>
              </div>

              <Link href="/dashboard/results" className="w-full py-5 bg-[#b91c1c] text-white font-black uppercase tracking-[0.4em] text-[12px] rounded-sm hover:bg-red-800 transition-all shadow-xl shadow-red-900/20 flex justify-center items-center gap-3 italic">
                <span>{t('secureAccess')}</span>
                <span className="material-symbols-outlined text-lg">login</span>
              </Link>
              
              <div className="text-center pt-8 border-t border-slate-100 mt-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 italic">{t('notAccredited')}</p>
                <Link href="#" className="w-full py-4 bg-white text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] rounded-sm hover:bg-slate-50 transition-all border border-slate-200 flex justify-center items-center gap-2 italic">
                  <span className="material-symbols-outlined text-lg">domain_add</span>
                  <span>{t('registerCompany')}</span>
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
