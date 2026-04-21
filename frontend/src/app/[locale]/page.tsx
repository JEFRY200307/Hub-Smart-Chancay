import { Link } from "@/navigation";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Hero' });
  const n = await getTranslations({ locale, namespace: 'Navigation' });
  const s = await getTranslations({ locale, namespace: 'Stats' });
  const f = await getTranslations({ locale, namespace: 'Footer' });
  const c = await getTranslations({ locale, namespace: 'Common' });
  return (
    <div className="flex flex-col min-h-screen font-body antialiased selection:bg-red-500/30">
      
      {/* 1. Navbar */}
      <nav className="absolute top-0 w-full flex justify-between items-center px-6 md:px-12 py-4 z-50 bg-white shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Logo CIP */}
          <div className="h-10 w-10 relative flex-shrink-0">
            <Image 
              src="/logo-cip.png" 
              alt="Logo CIP Lima" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tighter">
            <span className="text-[#a51c1c]">{c('title')}</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[13px] font-bold uppercase tracking-widest">
          <Link href="/" className="text-red-700 border-b-2 border-red-600 pb-1">
            {n('home')}
          </Link>
          <Link href="/nosotros" className="text-slate-500 hover:text-red-700 transition-colors">
            {n('about')}
          </Link>
          <Link href="/marco-legal" className="text-slate-500 hover:text-red-700 transition-colors">
            {n('legal')}
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <Link href="/login" className="bg-[#b91c1c] text-white px-6 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap">
            {c('login')}
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-24 pt-24 pb-16 w-full">
        {/* Background Image Placeholder (Barco/Océano) */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2070&auto=format&fit=crop" 
            alt="Puerto de Chancay Océano" 
            className="w-full h-full object-cover"
          />
          {/* Degradado para oscurecer un poco y permitir lectura */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl text-white">
          {/* Badge Respaldo */}
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 text-[#ff4d4d] text-[10px] font-bold px-3 py-1.5 rounded-full w-fit mb-6 uppercase tracking-wider backdrop-blur-sm">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            {t('badge')}
          </div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-[4.5rem] font-bold tracking-tighter leading-[0.95] mb-6 drop-shadow-lg uppercase italic">
            {t.rich('title', {
              span: (chunks) => <span className="text-[#ff3333] block">{chunks}</span>,
              br: () => <br />
            })}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-100 font-medium leading-relaxed mb-10 max-w-xl opacity-90">
            {t('subtitle')}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/onboarding" className="bg-[#cc1f1f] text-white px-8 py-5 rounded-sm font-bold uppercase tracking-widest hover:bg-[#b01818] transition-colors flex items-center justify-center gap-2 text-[12px] shadow-xl shadow-red-950/40">
              {t('ctaStart')}
              <span className="material-symbols-outlined text-lg">bolt</span>
            </Link>
            <Link href="/marco-legal" className="bg-white/10 border border-white/30 backdrop-blur-md text-white px-8 py-5 rounded-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center justify-center text-[12px]">
              {t('ctaLegal')}
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Liderazgo e Indicadores (Light Blue Area) */}
      <section className="bg-[#f8fafc] w-full px-6 md:px-24 py-20 border-b border-slate-200">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 w-full max-w-7xl mx-auto">
          {/* Left Large Card: Liderazgo */}
          <div className="lg:col-span-2 bg-white rounded-xl p-10 flex flex-col justify-between border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">{s('leadership')}</h2>
              <p className="text-slate-500 leading-relaxed mb-6 max-w-2xl font-bold text-sm uppercase tracking-wide">
                {s('leadershipDesc')}
              </p>
            </div>
            
            <div className="w-full h-px bg-slate-300/60 my-6"></div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-x-16 gap-y-8 relative z-10">
              <div>
                <p className="text-[#b91c1c] text-4xl font-black tracking-tighter">$3.6B</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{s('investment')}</p>
              </div>
              <div>
                <p className="text-[#b91c1c] text-4xl font-black tracking-tighter">+15k</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{s('jobs')}</p>
              </div>
              <div>
                <p className="text-[#b91c1c] text-4xl font-black tracking-tighter">100%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{s('compliance')}</p>
              </div>
            </div>
          </div>

          {/* Right Red Card: Potencia Industrial */}
          <div className="lg:col-span-1 bg-[#b91c1c] rounded-xl p-10 text-white flex flex-col justify-center items-center text-center shadow-2xl shadow-red-950/40 relative overflow-hidden group">
            <span className="material-symbols-outlined text-5xl mb-4 font-light opacity-90 group-hover:scale-110 transition-transform duration-500">precision_manufacturing</span>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Potencia Industrial</h3>
            <p className="text-[11px] font-bold text-red-100/80 leading-relaxed mb-8 uppercase tracking-widest italic">
              Accede a infraestructura de datos crítica para manufactura avanzada y logística global.
            </p>
            
            {/* Progress Bar Area */}
            <div className="w-full mt-auto">
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-white w-[75%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-center text-white/90">{s('installedCapacity')}: 75%</p>
            </div>
          </div>
        </div>

        {/* 3 Tiles Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
          {/* Tile 1 */}
          <div className="bg-[#f1f5f9] rounded-xl p-8 flex items-start gap-4 border border-slate-200/50 hover:bg-slate-100 transition-colors">
            <div className="bg-white p-3 rounded shadow-sm text-[#b91c1c] shrink-0">
              <span className="material-symbols-outlined text-xl">security</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Validación Técnica</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Algoritmos supervisados por comités de ingeniería especializados del CIP Lima.</p>
            </div>
          </div>
          
          {/* Tile 2 */}
          <div className="bg-[#f1f5f9] rounded-xl p-8 flex items-start gap-4 border border-slate-200/50 hover:bg-slate-100 transition-colors">
            <div className="bg-white p-3 rounded shadow-sm text-[#b91c1c] shrink-0">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Seguridad Jurídica</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Traducción instantánea de normativas ZEEP a flujos de trabajo operativos.</p>
            </div>
          </div>
          
          {/* Tile 3 */}
          <div className="bg-[#f1f5f9] rounded-xl p-8 flex items-start gap-4 border border-slate-200/50 hover:bg-slate-100 transition-colors">
            <div className="bg-white p-3 rounded shadow-sm text-[#b91c1c] shrink-0">
              <span className="material-symbols-outlined text-xl">hub</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Conectividad Global</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Integración directa con el hub logístico Chancay-Shanghai en tiempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Section */}
      <section className="bg-slate-900 py-32 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 uppercase relative z-10 italic">
          ¿Listo para el futuro de la logística?
        </h2>
        <p className="text-slate-400 max-w-2xl mb-12 leading-relaxed font-bold uppercase tracking-widest text-xs relative z-10 italic">
          Obtén un informe detallado sobre la viabilidad de tus operaciones en PLAIA bajo los parámetros del CIP Lima.
        </p>
        <button className="bg-[#cc1f1f] text-white font-black text-[12px] uppercase tracking-[0.3em] px-12 py-5 rounded-sm shadow-2xl shadow-red-950/50 hover:bg-[#b01818] transition-all hover:-translate-y-1 relative z-10">
          Comenzar Diagnóstico Institucional
        </button>
      </section>

      {/* 5. Footer */}
      <footer className="bg-[#f1f5f9] py-14 px-6 md:px-24 w-full border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 md:gap-8">
          
          {/* Brand Col */}
          <div className="flex flex-col max-w-xs">
            <span className="text-2xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">{f('brand')}</span>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              {f('copyright')}
            </p>
          </div>

          {/* Resources Col */}
          <div className="flex flex-col">
            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.25em] mb-8 border-l-2 border-red-600 pl-4">{f('resources')}</h5>
            <div className="flex flex-col gap-4">
              <Link href="#" className="text-slate-500 text-sm hover:text-slate-900 transition-colors">Transparencia</Link>
              <Link href="#" className="text-slate-500 text-sm hover:text-slate-900 transition-colors">Soporte Técnico</Link>
              <Link href="#" className="text-slate-500 text-sm hover:text-slate-900 transition-colors">Contacto</Link>
              <Link href="#" className="text-slate-500 text-sm hover:text-slate-900 transition-colors">Privacidad</Link>
            </div>
          </div>

          {/* Contact Col */}
          <div className="flex flex-col">
            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.25em] mb-8 border-l-2 border-red-600 pl-4">{f('contact')}</h5>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm hover:text-slate-900 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                contacto@cip-lima.org.pe
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm hover:text-slate-900 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                Calle Marconi 210, San Isidro
              </div>
            </div>
          </div>

          {/* Quality Seal / Image Col */}
          <div className="flex flex-col">
            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.25em] mb-8 border-l-2 border-red-600 pl-4">{f('qualitySeal')}</h5>
            <div className="h-16 w-16 relative grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer bg-slate-300 rounded p-1">
              <Image 
                src="/logo-cip.png" 
                alt="Logo CIP Monocromático"
                fill
                className="object-contain"
              />
            </div>
          </div>

        </div>
      </footer>
      
    </div>
  );
}
