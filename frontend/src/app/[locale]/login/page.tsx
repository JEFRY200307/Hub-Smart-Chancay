import { Link } from "@/navigation";
import { getTranslations } from 'next-intl/server';
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Suspense } from "react";
import LoginPanel from "@/components/LoginPanel";
import BrandLogo from "@/components/BrandLogo";
import LoginNotice from "@/components/LoginNotice";

export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Login' });
  const c = await getTranslations({ locale, namespace: 'Common' });

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-white/5 backdrop-blur-md">
        <BrandLogo href="/" height={36} priority />
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

            <Suspense fallback={null}>
              <LoginNotice />
            </Suspense>
            <Suspense fallback={<div className="h-48 animate-pulse bg-slate-50 rounded" />}>
              <LoginPanel />
            </Suspense>
            <p className="text-center text-[10px] text-slate-400 mt-6 italic leading-relaxed">
              Demo Perú: inversor@hubchancay.pe / HubChancay2025!
              <br />
              Empresa extranjera (CN): extranjera.cn@comex-ai.test / ComexExtranjera2025!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
