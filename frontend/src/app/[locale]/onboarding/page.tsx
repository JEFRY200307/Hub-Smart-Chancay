import { Link } from "@/navigation";
import { getTranslations } from 'next-intl/server';
import LocaleSwitcher from "@/components/LocaleSwitcher";
import OnboardingForm from "@/components/OnboardingForm";
import BrandLogo from "@/components/BrandLogo";
import LogoutButton from "@/components/LogoutButton";

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Onboarding' });
  const n = await getTranslations({ locale, namespace: 'Navigation' });
  const c = await getTranslations({ locale, namespace: 'Common' });
  const f = await getTranslations({ locale, namespace: 'Footer' });

  return (
    <div className="bg-surface text-on-surface selection:bg-red-500/30 min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#131d24]/80 backdrop-blur-lg flex justify-between items-center px-12 h-20 max-w-[1920px] mx-auto border-b border-slate-200/20">
        <div className="flex items-center gap-4">
          <BrandLogo href="/" height={36} priority />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-slate-500 hover:text-[#a51c1c] transition-colors font-bold uppercase text-[11px] tracking-widest">{n('dashboard')}</Link>
          <Link href="/" className="text-slate-500 hover:text-[#a51c1c] transition-colors font-bold uppercase text-[11px] tracking-widest">{n('benefits')}</Link>
          <Link href="/operators" className="text-slate-500 hover:text-[#a51c1c] transition-colors font-bold uppercase text-[11px] tracking-widest">{n('port')}</Link>
          <Link href="/services" className="text-slate-500 hover:text-[#a51c1c] transition-colors font-bold uppercase text-[11px] tracking-widest">{n('services')}</Link>
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <LogoutButton
            label={c("logout")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#b91c1c] text-white font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-red-900/20"
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-12 max-w-[1440px] mx-auto min-h-screen">
        {/* Header & Progress Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[#a51c1c] font-black tracking-[0.3em] text-[10px] uppercase mb-2 italic">{t('institutionalProfiling')}</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-headline uppercase italic">{t('step1')}</h1>
            </div>
             <div className="w-full md:w-80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('progress')}</span>
                <span className="text-[10px] font-black text-[#a51c1c] uppercase tracking-widest italic">25%</span>
              </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#a51c1c] w-[25%] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(165,28,28,0.5)]"></div>
              </div>
            </div>
          </div>
        </div>

        <OnboardingForm />
        <div className="hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: AI Assistant Panel */}
          <aside className="lg:col-span-4 sticky top-32">
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
               <div className="relative w-32 h-32 mb-6 mx-auto lg:mx-0">
                <img alt="AI Analyst" className="w-full h-full object-cover rounded-sm shadow-xl grayscale hover:grayscale-0 transition-all duration-500 border border-slate-200" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 px-3 py-1.5 rounded-sm flex items-center gap-1.5 shadow-2xl border border-white/20">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black text-white tracking-[0.2em]">{t('aiAnalyst')}</span>
                </div>
              </div>
               <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 font-headline uppercase tracking-tighter italic">{t('welcome')}</h3>
                <div className="p-6 bg-white rounded-sm relative border border-slate-100 shadow-sm">
                  <div className="absolute -left-2 top-6 w-4 h-4 bg-white rotate-45 border-l border-b border-slate-100"></div>
                  <p className="text-slate-500 leading-relaxed italic font-bold text-sm uppercase tracking-wide">
                    {t('aiGreeting')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-tertiary-container text-on-tertiary text-[10px] font-bold rounded-full uppercase tracking-widest">Protocol V.2</span>
                  <span className="px-3 py-1 bg-surface-container-highest text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-widest">Secure Data</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Side: Capture Form */}
          <section className="lg:col-span-8 space-y-8">
            {/* Sector Selection */}
             <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
                <span className="w-8 h-8 rounded-sm bg-[#a51c1c] text-white flex items-center justify-center font-black text-xs">01</span>
                {t('qSector')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sector Card: Logistics */}
                <div className="group cursor-pointer bg-surface-container-lowest border-2 border-transparent hover:border-primary p-6 rounded-xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined" data-icon="conveyor_belt">conveyor_belt</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Logística</p>
                      <p className="text-sm text-secondary leading-snug">Transporte, almacenamiento y distribución multimodal.</p>
                    </div>
                  </div>
                </div>
                {/* Sector Card: Manufacturing */}
                <div className="group cursor-pointer bg-surface-container-lowest border-2 border-transparent hover:border-primary p-6 rounded-xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined" data-icon="precision_manufacturing">precision_manufacturing</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Manufactura</p>
                      <p className="text-sm text-secondary leading-snug">Ensamblaje avanzado y procesos industriales pesados.</p>
                    </div>
                  </div>
                </div>
                {/* Sector Card: Tech */}
                <div className="group cursor-pointer bg-surface-container-lowest border-2 border-primary p-6 rounded-xl transition-all duration-300 shadow-xl shadow-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white transition-colors">
                      <span className="material-symbols-outlined" data-icon="biotech">biotech</span>
                    </div>
                    <div>
                      <p className="font-bold text-primary transition-colors">Tecnología &amp; I+D</p>
                      <p className="text-sm text-secondary leading-snug">Desarrollo de software, centros de datos y laboratorios.</p>
                    </div>
                  </div>
                </div>
                {/* Sector Card: Agro */}
                <div className="group cursor-pointer bg-surface-container-lowest border-2 border-transparent hover:border-primary p-6 rounded-xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined" data-icon="agriculture">agriculture</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Agroindustria</p>
                      <p className="text-sm text-secondary leading-snug">Procesamiento de exportación y cadena de frío.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

             {/* Metrics Section */}
            <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
                <span className="w-8 h-8 rounded-sm bg-[#a51c1c] text-white flex items-center justify-center font-black text-xs">02</span>
                {t('qMetrics')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest ml-1">Estimación de Inversión (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                    <input className="w-full bg-surface-container-lowest border-0 focus:ring-2 focus:ring-primary/20 rounded-xl py-4 pl-10 pr-4 text-on-surface font-semibold placeholder:text-surface-container-highest transition-all" placeholder="0.00" type="number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest ml-1">Espacio Requerido (M²)</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary text-sm font-bold">SQM</span>
                    <input className="w-full bg-surface-container-lowest border-0 focus:ring-2 focus:ring-primary/20 rounded-xl py-4 px-4 text-on-surface font-semibold placeholder:text-surface-container-highest transition-all" placeholder="2,500" type="number" />
                  </div>
                </div>
              </div>
            </div>

             {/* Capital Section */}
            <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
                <span className="w-8 h-8 rounded-sm bg-[#a51c1c] text-white flex items-center justify-center font-black text-xs">03</span>
                {t('qCapital')}
              </h4>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-3 bg-surface-container-lowest border-2 border-transparent hover:border-primary rounded-xl text-sm font-bold text-secondary hover:text-primary transition-all">National</button>
                <button className="px-6 py-3 bg-primary text-white border-2 border-primary rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20">Foreign Direct Investment</button>
                <button className="px-6 py-3 bg-surface-container-lowest border-2 border-transparent hover:border-primary rounded-xl text-sm font-bold text-secondary hover:text-primary transition-all">Public-Private Partnership</button>
                <button className="px-6 py-3 bg-surface-container-lowest border-2 border-transparent hover:border-primary rounded-xl text-sm font-bold text-secondary hover:text-primary transition-all">Venture / Institutional</button>
              </div>
            </div>

             {/* Action Button */}
            <div className="flex justify-end pt-4">
              <Link href="/onboarding/processing" className="group flex items-center gap-3 px-10 py-5 bg-[#b91c1c] text-white rounded-sm font-black text-[12px] uppercase tracking-[0.3em] hover:bg-red-800 transition-all scale-100 active:scale-95 shadow-xl shadow-red-900/40 italic">
                {t('continue')}
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-2" data-icon="arrow_forward">arrow_forward</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#ebf5ff] dark:bg-[#131d24] w-full border-t-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-10 w-full gap-6 max-w-[1920px] mx-auto">
           <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <BrandLogo height={32} />
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{c('subtitle')}</span>
            </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
              {f('copyright')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#b9151e] dark:hover:text-[#dd3333] transition-colors font-body text-sm tracking-wide" href="#">Privacidad</Link>
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#b9151e] dark:hover:text-[#dd3333] transition-colors font-body text-sm tracking-wide" href="#">Términos de Inversión</Link>
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#b9151e] dark:hover:text-[#dd3333] transition-colors font-body text-sm tracking-wide" href="#">Mapa del Puerto</Link>
            <Link className="text-slate-500 dark:text-slate-400 hover:text-[#b9151e] dark:hover:text-[#dd3333] transition-colors font-body text-sm tracking-wide" href="#">Contacto Institucional</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
