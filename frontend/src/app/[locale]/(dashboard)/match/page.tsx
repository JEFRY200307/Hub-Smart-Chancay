import React from 'react';

export default function MatchFeedPage() {
  return (
    <main className="lg:ml-64 p-8 bg-surface w-full">
      {/* Header Section */}
      <header className="mb-12 max-w-6xl">
        <div className="flex justify-between items-end gap-6 mb-4">
          <div className="space-y-2">
            <span className="font-label text-secondary text-[0.6875rem] font-bold tracking-[0.2em] uppercase">Intelligence Engine</span>
            <h1 className="text-5xl font-extrabold font-headline tracking-tight text-primary leading-tight">Match Feed</h1>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold font-label text-slate-400 uppercase tracking-widest">Active Alerts</span>
              <span className="text-xl font-bold text-secondary">24 Matches Found</span>
            </div>
          </div>
        </div>
        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Personalized opportunities from global logistics entities mapped to your Peruvian service profile.
        </p>
      </header>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl">
        {/* Match Feed Column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-surface-container-low p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[240px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full bg-white border-none text-sm py-2.5 pl-10 focus:ring-1 focus:ring-primary outline-none rounded-md" placeholder="Search by sector, country or project scale..." type="text"/>
            </div>
            <div className="flex gap-2">
              <button className="bg-white px-4 py-2 text-xs font-bold font-label uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-high transition-colors rounded-md border border-outline-variant/20">
                <span className="material-symbols-outlined text-sm">tune</span> Filter
              </button>
            </div>
          </div>

          {/* Match Cards */}
          <div className="space-y-6">
            {/* Card 1: High Match */}
            <div className="bg-surface-container-lowest group relative overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(19,29,36,0.06)] rounded-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-fixed flex items-center justify-center rounded-lg">
                      <span className="material-symbols-outlined text-primary">transportation</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-headline text-primary">Maritime Cold Chain Expansion</h3>
                      <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Global Logistics Corp • Hamburg, Germany</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-secondary/10 text-secondary text-[0.625rem] font-black font-label px-3 py-1 uppercase tracking-widest mb-1 rounded">98% Match</span>
                    <span className="text-xs text-outline font-medium">Posted 2h ago</span>
                  </div>
                </div>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Seeking specialized Peruvian partners for integrated refrigerated transport between Chancay and Northern EU ports. Requirement includes ISO 14001 certification and terminal handling capabilities.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1 bg-surface-variant text-[0.6875rem] font-bold font-label uppercase tracking-wider text-primary rounded-full">Refrigerated Logistics</span>
                  <span className="px-3 py-1 bg-surface-variant text-[0.6875rem] font-bold font-label uppercase tracking-wider text-primary rounded-full">Chancay Hub</span>
                </div>
                <div className="flex justify-between items-center border-t border-outline-variant/10 pt-6">
                  <div className="flex gap-4">
                    <button className="bg-primary text-on-primary px-6 py-2.5 text-xs font-bold font-label uppercase tracking-widest transition-transform active:scale-95 rounded-md">Initiate Connection</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 2: Strategic Match */}
            <div className="bg-surface-container-lowest group relative overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(19,29,36,0.06)] rounded-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-tertiary-fixed flex items-center justify-center rounded-lg">
                      <span className="material-symbols-outlined text-tertiary">engineering</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-headline text-primary">Phase 2 Terminal Automation</h3>
                      <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Pacific Rim Infra • Shanghai, China</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-tertiary/10 text-tertiary text-[0.625rem] font-black font-label px-3 py-1 uppercase tracking-widest mb-1 rounded">82% Match</span>
                  </div>
                </div>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Procurement project for local engineering firms to support installation and maintenance of automated stacking cranes and AGVs at the Chancay terminal.
                </p>
                <div className="flex justify-between items-center border-t border-outline-variant/10 pt-6">
                  <div className="flex gap-4">
                    <button className="text-xs font-bold font-label uppercase tracking-widest text-primary hover:text-secondary transition-colors mr-4">View Brief</button>
                    <button className="bg-primary text-on-primary px-6 py-2.5 text-xs font-bold font-label uppercase tracking-widest transition-transform active:scale-95 rounded-md">Inquire Access</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Column */}
        <div className="xl:col-span-4 space-y-8">
          <section className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/5">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary">mail</span>
              <h2 className="text-sm font-black font-label uppercase tracking-[0.2em] text-primary">Email Alerts</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-primary">Instant Match Alerts</p>
                  <p className="text-[0.6875rem] text-on-surface-variant">Notify me when a 90%+ match is found</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary p-8 text-white relative overflow-hidden rounded-xl">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <h2 className="text-sm font-black font-label uppercase tracking-[0.2em] mb-6">Service Profile Accuracy</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black font-headline tracking-tighter">84%</span>
              <span className="text-primary-container font-bold text-xs">+12% this month</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 mb-6 rounded-full overflow-hidden">
              <div className="bg-secondary h-full w-[84%]"></div>
            </div>
            <p className="text-[0.6875rem] leading-relaxed text-slate-300 mb-6 uppercase tracking-wider font-bold">
              Completing your Terminal Security certification will unlock 15 additional project matches.
            </p>
            <button className="w-full bg-white text-primary py-3 text-xs font-bold font-label uppercase tracking-widest transition-transform active:scale-95 rounded-md">
              Update Profile Data
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
