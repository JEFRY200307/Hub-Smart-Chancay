import Link from 'next/link';

export default function ResultsDashboard() {
  return (
    <div className="font-body antialiased min-h-screen flex flex-col bg-[#f6f9ff] text-[#131d24]">
      {/* TopNavBar Shared Component */}
      <nav className="fixed top-0 w-full z-50 bg-[#f6f9ff]/80 dark:bg-[#131d24]/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(19,29,36,0.06)]">
        <div className="flex justify-between items-center w-full px-8 h-20 max-w-[1440px] mx-auto">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <img alt="CIP LIMA Logo" className="h-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApKFRpUpVcNf0YM3-A450cxbLHsz5F7uZz5S8VAdKNqeayyvFwjs7G54le43xGjppZB1s2FmYtM1hakcPRtq5q5zTAg7UcT0_7KA1YGEARCZWasHSgPeILBVEtZCJ1eK9I2y5foMNuB4wgpjIZLUSjopPGu_5prrze2Z9RJPl7I92AFK7yi4mE4RhddE00ttKRVvWyZbesc15kZBlC2XWxgQdWqu69WIaKS9b6QtRJQITaSdyIMcCHpPqFSRaio3HPZmO5BtJx" />
            <span className="font-headline font-black tracking-tighter text-xl text-[#b9151e] dark:text-[#dd3333]">ChancayConnect IA</span>
          </div>
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-[#b9151e] dark:text-[#dd3333] font-bold border-b-2 border-[#b9151e] pb-1 active:scale-95 transition-transform">Dashboard</Link>
            <Link href="#" className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#b9151e] hover:bg-[#e5effa] dark:hover:bg-[#253441] transition-colors duration-300 px-3 py-2 rounded-lg active:scale-95">Reportes</Link>
            <Link href="#" className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#b9151e] hover:bg-[#e5effa] dark:hover:bg-[#253441] transition-colors duration-300 px-3 py-2 rounded-lg active:scale-95">Soporte</Link>
          </div>
          {/* Trailing Action */}
          <div className="flex items-center">
            <button className="flex items-center gap-2 font-medium text-slate-600 hover:text-[#b9151e] transition-colors">
              <span className="material-symbols-outlined">person</span>
              <span>Perfil</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-[1440px] mx-auto w-full flex flex-col gap-12">
        {/* Header & Main CTA */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="max-w-2xl">
            <p className="text-primary font-bold tracking-widest uppercase text-sm mb-2">Análisis Completado</p>
            <h1 className="font-headline font-extrabold text-on-surface leading-tight tracking-tight text-5xl mb-4">
              Resultados de <br/>Elegibilidad ZEEP
            </h1>
            <p className="font-body text-on-surface-variant text-lg leading-relaxed">
              Basado en sus datos corporativos, su proyecto presenta una viabilidad excepcional para integrarse al clúster logístico-industrial de Chancay.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg px-8 py-5 rounded-xl shadow-[0_12px_40px_rgba(185,21,30,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
              Descargar Reporte + Reservar Asesoría CIP
            </button>
          </div>
        </header>

        {/* Bento Grid: Analytics & Benefits */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Score Gauge */}
          <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-10 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative Gradient Blur */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="font-headline font-bold text-on-surface text-xl mb-8 w-full text-center">Score de Elegibilidad</h2>
            {/* Circular Gauge */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary transition-all duration-1000 ease-out" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="15.07" strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-headline font-extrabold text-6xl text-on-surface tracking-tighter">94%</span>
                <span className="font-body text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mt-2">Nivel Óptimo</span>
              </div>
            </div>
            <p className="font-body text-center text-on-surface-variant text-sm px-4">
              Su perfil técnico y financiero supera el umbral del 85% requerido para fast-track institucional.
            </p>
          </div>

          {/* Right Column: Projected Benefits */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefit Card 1 */}
            <div className="bg-surface-container rounded-xl p-10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
              <div>
                <div className="w-14 h-14 bg-surface-container-lowest rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
                </div>
                <h3 className="font-headline font-bold text-3xl text-on-surface mb-3 tracking-tight">0% IR por 10 años</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">
                  Exoneración total del Impuesto a la Renta garantizada durante la primera década de operaciones dentro del régimen ZEEP, maximizando su ROI inicial.
                </p>
              </div>
              <div className="mt-8 border-t border-surface-variant pt-6">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">Impacto Financiero Proyectado</span>
                <div className="text-2xl font-headline font-extrabold text-on-surface mt-1">+22% TIR</div>
              </div>
            </div>

            {/* Benefit Card 2 */}
            <div className="bg-surface-container rounded-xl p-10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
              <div>
                <div className="w-14 h-14 bg-surface-container-lowest rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
                </div>
                <h3 className="font-headline font-bold text-3xl text-on-surface mb-3 tracking-tight">Exoneración de Aranceles</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">
                  Ingreso libre de impuestos para bienes de capital, maquinaria industrial y materia prima destinada a la transformación en el polo de desarrollo.
                </p>
              </div>
              <div className="mt-8 border-t border-surface-variant pt-6">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">Ahorro Logístico Estimado</span>
                <div className="text-2xl font-headline font-extrabold text-on-surface mt-1">-15% Costos Op.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Territorial Match Section */}
        <section className="bg-surface-container-highest rounded-xl overflow-hidden flex flex-col lg:flex-row mt-4 relative">
          {/* Info Panel */}
          <div className="lg:w-1/3 p-10 flex flex-col justify-center bg-surface-container-low z-10 relative">
            <h2 className="font-headline font-bold text-2xl text-on-surface mb-4">Match Territorial ZEEP</h2>
            <p className="font-body text-on-surface-variant mb-8">
              Basado en sus requerimientos de carga pesada y conectividad energética, hemos identificado 3 macrolotes óptimos en el Parque Industrial de Ancón y la zona de influencia directa del puerto.
            </p>
            <ul className="flex flex-col gap-4">
              <li className="bg-surface-container-lowest p-4 rounded-lg flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">A</div>
                <div>
                  <div className="font-bold text-on-surface text-sm">Lote Industrial Norte - Sector 4</div>
                  <div className="text-xs text-on-surface-variant">Acceso directo a Vía Evitamiento</div>
                </div>
              </li>
              <li className="bg-surface-container-lowest p-4 rounded-lg flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-full bg-secondary text-on-primary flex items-center justify-center font-bold text-sm">B</div>
                <div>
                  <div className="font-bold text-on-surface text-sm">Zona Franca - Hub Logístico</div>
                  <div className="text-xs text-on-surface-variant">Alta capacidad energética instalada</div>
                </div>
              </li>
            </ul>
          </div>
          {/* Map Visual (Bleed Layout) */}
          <div className="lg:w-2/3 h-96 lg:h-auto relative bg-surface-dim">
            <img alt="Mapa Satelital Chancay" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLRuN_MGX3gCvWf3joCoRJAP3Hut0RAbrRD_IcGnSZfICafoSNVulO5bZ9o13v_Y1y4d_8ddT1bbCuocrhstem31ByH2mxXFwsjBs_TCYp9O9aXlyjv-Fcv20wVKm8jhtNMhJy8n2eEZnkW0Mzd8cIODhStgsh4e322P2-anuqKDZPD-i8UbL48ci2SgXc89BuHUauIOlvOvhp8atzE6HvHFuPS7f8m93PA0Ns5SJqtOZuZlg8DPp-uvcn37pTQ2n6E0nSlE_n" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low to-transparent lg:w-32"></div>
            {/* Simulated Pins */}
            <div className="absolute top-1/3 left-1/3 flex flex-col items-center animate-pulse">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold shadow-xl border-4 border-surface-container-lowest">A</div>
              <div className="w-1 h-6 bg-primary"></div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-on-primary font-bold shadow-xl border-4 border-surface-container-lowest">B</div>
              <div className="w-1 h-4 bg-secondary"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Shared Component */}
      <footer className="bg-[#ebf5ff] dark:bg-[#131d24] w-full py-12 mt-auto border-t border-[#131d24]/05 dark:border-white/05">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-[1440px] mx-auto gap-8">
          <div className="font-headline font-bold text-on-surface flex flex-col items-center md:items-start gap-2">
            <span className="text-[#b9151e] dark:text-[#dd3333]">ChancayConnect IA</span>
            <span className="font-body text-sm leading-relaxed text-slate-500">© 2024 CIP LIMA. El Vanguardismo Institucional.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="#" className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400 hover:text-[#dd3333] transition-colors">Aviso Legal</Link>
            <Link href="#" className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400 hover:text-[#dd3333] transition-colors">Privacidad</Link>
            <Link href="#" className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400 hover:text-[#dd3333] transition-colors">Contacto</Link>
            <Link href="#" className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400 hover:text-[#dd3333] transition-colors">Soporte Técnico</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
