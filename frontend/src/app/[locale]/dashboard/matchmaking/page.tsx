import Link from 'next/link';

export default function MatchmakingPage() {
  return (
    <div className="bg-background text-on-background font-body min-h-screen flex antialiased">
      {/* SideNavBar */}
      <nav className="hidden md:flex bg-[#ebf5ff] dark:bg-[#131d24] h-screen w-64 border-r-0 fixed left-0 top-0 flex-col py-8 z-50">
        {/* Header */}
        <div className="px-8 mb-12">
          <div className="flex items-center gap-3">
            <img alt="CIP Lima Institutional Seal" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe4lyFIRj2bJG-avDEGrDRE37enHUdcg9SXbmHBdKLirt3ufrFT1hpu2B-GEubqDZ7VK_PTu2SSFYZsgaLA6O1XbHJ8o_0Rd-1QQdd8Zb_hMNb9d-NrdU9762V7DEhJA87oMTbsCfeu8kRsxfkVmcyzCqw86nCp6rjI52cMPn6mhjZo7DEOIiqEvfH3w_KfQ_Jo7mjPN4xMcHa8uIT8gIE-7PJPyacL1khVJ0kokzkkKX69ntyU17Phkdd_X8YZlwV70I80ViZ" />
            <div>
              <h1 className="font-headline font-extrabold text-[#b9151e] text-lg tracking-tight">CIP LIMA</h1>
              <p className="font-body text-xs text-on-background/70 font-medium">Vanguard Portal</p>
            </div>
          </div>
        </div>
        {/* Main Navigation */}
        <div className="flex-1 flex flex-col gap-2">
          <Link href="#" className="flex items-center gap-4 py-3 px-8 text-[#131d24]/70 dark:text-white/70 pl-5 font-['Inter'] font-medium text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all scale-[0.99] active:scale-95">
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <span>Ecosystem</span>
          </Link>
          {/* Active */}
          <Link href="/dashboard/matchmaking" className="flex items-center gap-4 py-3 px-8 text-[#131d24] dark:text-white font-bold border-l-4 border-[#b9151e] pl-4 font-['Inter'] text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
            <span>Matchmaking</span>
          </Link>
          <Link href="#" className="flex items-center gap-4 py-3 px-8 text-[#131d24]/70 dark:text-white/70 pl-5 font-['Inter'] font-medium text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all scale-[0.99] active:scale-95">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
            <span>Investments</span>
          </Link>
          <Link href="/dashboard/validator" className="flex items-center gap-4 py-3 px-8 text-[#131d24]/70 dark:text-white/70 pl-5 font-['Inter'] font-medium text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all scale-[0.99] active:scale-95">
            <span className="material-symbols-outlined text-[20px]">verified</span>
            <span>Certifications</span>
          </Link>
          <Link href="/dashboard/concierge" className="flex items-center gap-4 py-3 px-8 text-[#131d24]/70 dark:text-white/70 pl-5 font-['Inter'] font-medium text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all scale-[0.99] active:scale-95">
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Network</span>
          </Link>
        </div>
        {/* CTA */}
        <div className="px-6 mb-8 mt-4">
          <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity">
            New Request
          </button>
        </div>
        {/* Footer Navigation */}
        <div className="flex flex-col gap-2 mt-auto">
          <Link href="#" className="flex items-center gap-4 py-3 px-8 text-[#131d24]/70 dark:text-white/70 pl-5 font-['Inter'] font-medium text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all scale-[0.99] active:scale-95">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span>Help Center</span>
          </Link>
          <Link href="/login" className="flex items-center gap-4 py-3 px-8 text-[#131d24]/70 dark:text-white/70 pl-5 font-['Inter'] font-medium text-sm hover:bg-[#e5effa] dark:hover:bg-[#1e2a35] transition-all scale-[0.99] active:scale-95">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Log Out</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 min-h-screen bg-surface">
        {/* TopAppBar (Mobile Fallback / Utility Header) */}
        <header className="bg-[#f6f9ff]/80 dark:bg-[#131d24]/80 backdrop-blur-xl w-full sticky top-0 z-40 flex justify-between items-center px-8 py-4 shadow-[0_12px_40px_rgba(19,29,36,0.06)] md:hidden">
          <div className="text-[#b9151e] dark:text-[#dd3333] font-headline font-bold text-xl uppercase tracking-wider">Chancay Vanguard</div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-on-surface hover:text-[#b9151e] transition-colors duration-300 cursor-pointer">notifications</span>
            <span className="material-symbols-outlined text-on-surface hover:text-[#b9151e] transition-colors duration-300 cursor-pointer">settings</span>
            <img alt="Investor Profile Avatar" className="w-8 h-8 rounded-full border border-surface-container-high" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqOOUeXD69eOkdwG1ADumGHxz8Ashn4sPGXZ7iwhK8drLWx49YYP4eX80KLWc0J6Gcg_-OBOiWlnSpiN5wCN5jRDPt5LfelZ9txua6hSa3ZwXq8UKr26PtdljbC_47j84A0uys3otrVVhtoK1g3xtB5X0E59Zgv19AZpVq5Wh5_PcO2ldmdrw-94XMTbrLLDnBzjXjlKtCttn4csmSy5eOXl40I9QjHjYoQ3VRyAorB4vrYdI0saTtCMvdFPZN1NJlXYb_7zOV" />
          </div>
          {/* Separation Logic Gradient */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-transparent to-[#ebf5ff] dark:to-[#1e2a35] h-2 translate-y-full"></div>
        </header>

        <div className="p-8 md:p-12 lg:p-16 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-surface to-transparent z-10 w-2/3 pointer-events-none"></div>
            <div className="relative z-20 max-w-3xl">
              <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface leading-[1.1] tracking-tight mb-6">
                Ecosistema de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">Matchmaking</span> Certificado
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-2xl">
                Conecte con socios estratégicos validados por el CIP Lima para optimizar su operación y fomentar el desarrollo local.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-surface-container-lowest rounded-xl p-4 mb-12 flex flex-col md:flex-row gap-4 shadow-[0_12px_40px_rgba(19,29,36,0.06)] items-center">
            <div className="flex-1 relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full bg-surface-container-high border-none rounded-lg py-3 pl-12 pr-4 text-on-surface font-body placeholder:text-on-surface-variant/70 focus:ring-0 focus:bg-surface-container-lowest focus:shadow-[inset_0_0_0_2px_rgba(185,21,30,0.2)] transition-all" placeholder="Buscar socios, sectores o servicios..." type="text" />
            </div>
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button className="bg-primary text-on-primary px-6 py-3 rounded-full font-label text-sm whitespace-nowrap flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Filtros
              </button>
              <button className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-label text-sm whitespace-nowrap hover:bg-surface-variant transition-colors">
                Sectores
              </button>
              <button className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-label text-sm whitespace-nowrap hover:bg-surface-variant transition-colors">
                Certificación
              </button>
            </div>
          </div>

          {/* Section: Socios Recomendados */}
          <div className="mb-8">
            <h2 className="font-headline font-bold text-2xl text-on-surface mb-8">Socios Recomendados</h2>
            
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1: Operador Logístico */}
              <div className="bg-surface-container-low rounded-2xl overflow-hidden group hover:bg-surface-container transition-colors duration-300 flex flex-col h-full">
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-surface-container-lowest rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-3xl text-primary">local_shipping</span>
                    </div>
                    <span className="bg-tertiary-container text-on-tertiary-fixed px-3 py-1 rounded-full font-label text-xs font-semibold tracking-wide uppercase">
                      Operador Logístico
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-2">LogiChancay</h3>
                  <p className="font-body text-sm text-on-surface-variant mb-6 line-clamp-2">
                    Especialistas en logística de última milla y gestión de almacenes aduaneros con infraestructura de vanguardia.
                  </p>
                  {/* Certification Tag */}
                  <div className="flex items-center gap-2 bg-surface-container-highest w-fit px-3 py-1.5 rounded-lg mb-6">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                    <span className="font-label text-xs font-medium text-on-surface">Certificación AEO</span>
                  </div>
                </div>
                {/* Footer: Sello & CTA */}
                <div className="bg-surface-container p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <img alt="Sello CIP Lima" className="w-6 h-6 rounded-full mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASY5tAr-d95LtNSvs15FQr4rnYMPIfMd1Dve4Ayqh2My9f0Ltieq2St4pO0qVOjb1Yc1LCkO0bFSZEgtYVMFV6Xooqni1ggY0_Jt3wSYiTTZVuopEHfWeo_rsAtFBq7R3nZog6BayulJNbuI2HI2ucQgLroFp39oVXlhK5kRaSNEvmCwH07XXI5-OcGGV_viKFJNqaQR2YZYGFLG2h-y0xzQBI2QgTzKJwN_Yh_HpgA70T4ghj-uxC1dA5rlgIs7WxxuVe7BKs" />
                    <span className="font-label text-xs font-medium text-on-surface-variant">Validado por CIP Lima</span>
                  </div>
                  <button className="text-primary font-label font-semibold text-sm hover:text-primary-container transition-colors flex items-center gap-1">
                    Ver Perfil Certificado
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Contratista Industrial */}
              <div className="bg-surface-container-low rounded-2xl overflow-hidden group hover:bg-surface-container transition-colors duration-300 flex flex-col h-full">
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-surface-container-lowest rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-3xl text-secondary">precision_manufacturing</span>
                    </div>
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label text-xs font-semibold tracking-wide uppercase">
                      Contratista Industrial
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-2">ConstruPeru</h3>
                  <p className="font-body text-sm text-on-surface-variant mb-6 line-clamp-2">
                    Ejecución de obras de infraestructura portuaria e industrial, cumpliendo los más altos estándares de seguridad.
                  </p>
                  {/* Certification Tag */}
                  <div className="flex items-center gap-2 bg-surface-container-highest w-fit px-3 py-1.5 rounded-lg mb-6">
                    <span className="material-symbols-outlined text-[16px] text-primary">engineering</span>
                    <span className="font-label text-xs font-medium text-on-surface">Proveedor Local</span>
                  </div>
                </div>
                {/* Footer: Sello & CTA */}
                <div className="bg-surface-container p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <img alt="Sello CIP Lima" className="w-6 h-6 rounded-full mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs3Oim-cpMGVSVCV8Z90txUpggom21-JhkKvrygil-8HrKQ3Z1J_-WtAc9VNAWDy_QCpbKl-VdTKjQrHrQ_9-6P8kBb7hlAIbjMSQ8G-_Az9mvUj7S4UDu1UOvIxntGYaxFQ1K4dflHMmj6ndlMcr8OHcR8Y7UKq_JNy7vitmUIZ_eKTBfeaiVw7_DBVzZtz4yPwOzTHbxUtOQIZxrL1-0llcmBsUa24Vb_Xmuxj2wsES9Yj0n2wdzvFl1mTRrteK-wMsD8FN6" />
                    <span className="font-label text-xs font-medium text-on-surface-variant">Validado por CIP Lima</span>
                  </div>
                  <button className="text-primary font-label font-semibold text-sm hover:text-primary-container transition-colors flex items-center gap-1">
                    Ver Perfil Certificado
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Servicios Complementarios */}
              <div className="bg-surface-container-low rounded-2xl overflow-hidden group hover:bg-surface-container transition-colors duration-300 flex flex-col h-full lg:col-span-1 md:col-span-2">
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-surface-container-lowest rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-3xl text-tertiary">eco</span>
                    </div>
                    <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-label text-xs font-semibold tracking-wide uppercase">
                      Servicios Complementarios
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-2">EcoEnergía</h3>
                  <p className="font-body text-sm text-on-surface-variant mb-6 line-clamp-2">
                    Consultoría en eficiencia energética y transición hacia operaciones sostenibles en complejos logísticos.
                  </p>
                  {/* Certification Tag */}
                  <div className="flex items-center gap-2 bg-surface-container-highest w-fit px-3 py-1.5 rounded-lg mb-6">
                    <span className="material-symbols-outlined text-[16px] text-primary">psychiatry</span>
                    <span className="font-label text-xs font-medium text-on-surface">Consultoría Sostenible</span>
                  </div>
                </div>
                {/* Footer: Sello & CTA */}
                <div className="bg-surface-container p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <img alt="Sello CIP Lima" className="w-6 h-6 rounded-full mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_f1xmM4GES9krXRdi2o5U5dSC2A8oxjfI5_7wA338SuxNk5liTQuHogvYTQ32JS32gOPtH7D_DUz_7B5zfP_75KmnTj7UbBi8dp62ZADJOvVaVRQmXuLjVPzpYnjUtd5rMBtvG-lEC6XC_k8ZxyeixfozvzfdESz453aviwDDuSK2iruS_P2pF9kuEBxD4VaJsxzAgQSEd956Ip0g4tuxKTjy4jmYxF8Wln8DNOtTWseE54LbsE9kjjoGqVpw94UBApzQoEZs" />
                    <span className="font-label text-xs font-medium text-on-surface-variant">Validado por CIP Lima</span>
                  </div>
                  <button className="text-primary font-label font-semibold text-sm hover:text-primary-container transition-colors flex items-center gap-1">
                    Ver Perfil Certificado
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
