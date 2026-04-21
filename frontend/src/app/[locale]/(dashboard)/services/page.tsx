import React from 'react';

export default function ServiceFinderPage() {
  return (
    <main className="lg:ml-64 pt-24 pb-12 px-8 min-h-screen w-full">
      {/* Header Section */}
      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/15 pb-8">
          <div className="max-w-2xl space-y-4">
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-secondary text-3xl" data-icon="search">search</span>
              <span className="text-[0.6875rem] font-blackfont-label text-secondary uppercase tracking-[0.2em]">Procurement Core</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tighter leading-tight font-headline">
              Chancay Service Finder
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed font-body">
              Locate and tender specific logistical and operational requirements to MINCETUR-certified local providers. The backbone of your supply chain starts here.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-md font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm" data-icon="add">add</span> Publish Requirement
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 justify-center md:justify-end">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              142 Active RFPs
            </div>
          </div>
        </div>
      </header>

      {/* Main UI Layout */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Column: Search & Filters */}
        <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
          {/* Universal Search Box */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" data-icon="manage_search">manage_search</span>
              <input className="w-full bg-surface-container-low text-on-surface text-sm pl-10 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-secondary transition-all outline-none placeholder:text-outline" placeholder="Search services, companies..." type="text"/>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/10">
              <h3 className="font-bold text-primary tracking-tight font-headline">Category Filter</h3>
            </div>
            <div className="p-4 space-y-2">
              <label className="flex items-center p-2 rounded-md hover:bg-surface-container transition-colors cursor-pointer group">
                <input className="w-4 h-4 text-secondary border-outline-variant rounded focus:ring-secondary/50 rounded-sm" type="checkbox"/>
                <span className="ml-3 text-sm text-on-surface-variant group-hover:text-primary transition-colors">Port Logistics (54)</span>
              </label>
              <label className="flex items-center p-2 rounded-md hover:bg-surface-container transition-colors cursor-pointer group">
                <input className="w-4 h-4 text-secondary border-outline-variant rounded focus:ring-secondary/50 rounded-sm" type="checkbox"/>
                <span className="ml-3 text-sm text-on-surface-variant group-hover:text-primary transition-colors">Heavy Manufacturing (21)</span>
              </label>
              <label className="flex items-center p-2 rounded-md hover:bg-surface-container transition-colors cursor-pointer group">
                <input className="w-4 h-4 text-secondary border-outline-variant rounded focus:ring-secondary/50 rounded-sm" type="checkbox"/>
                <span className="ml-3 text-sm text-on-surface-variant group-hover:text-primary transition-colors">Customs Agencies (89)</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Column: Results */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="text-sm font-semibold text-primary">Found <strong>34</strong> certified services</span>
            <select className="bg-transparent border-none text-sm text-secondary font-bold cursor-pointer focus:ring-0">
              <option>Sort by: Match AI Score</option>
              <option>Sort by: Rating</option>
              <option>Sort by: Recent</option>
            </select>
          </div>

          {/* Service Card 1 */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-3xl" data-icon="local_shipping">local_shipping</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="font-bold text-lg text-primary group-hover:text-secondary transition-colors font-headline">Refrigerated Heavy Transport</h3>
                <span className="bg-secondary/10 text-secondary text-[0.625rem] font-black tracking-widest uppercase px-2 py-1 rounded">Top Rated</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
                End-to-end cold chain logistics from Chancay Port to Lima Metropolitan Area. Features IoT temperature tracking and MINSA certified drivers.
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[1rem]">verified</span> PACIFIC LOGISTICS PERU</span>
                <span className="flex items-center gap-1 text-yellow-600"><span className="material-symbols-outlined text-[1rem]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 4.9 (124)</span>
              </div>
            </div>
            <button className="whitespace-nowrap px-4 py-2 border border-outline/30 rounded-md text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
              Request Quote
            </button>
          </div>

          {/* Service Card 2 */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-3xl" data-icon="inventory_2">inventory_2</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="font-bold text-lg text-primary group-hover:text-secondary transition-colors font-headline">Automated ZEEP Warehousing</h3>
                <span className="bg-primary/10 text-primary text-[0.625rem] font-black tracking-widest uppercase px-2 py-1 rounded">Tier 1</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
                50,000 sqm of bonded warehouse space within the ZEEP perimeter. Includes AI-driven inventory management and automated guided vehicles (AGV) integration.
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[1rem]">verified</span> ANDEAN MEGAHUB CORP</span>
                <span className="flex items-center gap-1 text-yellow-600"><span className="material-symbols-outlined text-[1rem]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 4.7 (89)</span>
              </div>
            </div>
            <button className="whitespace-nowrap px-4 py-2 border border-outline/30 rounded-md text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
              Request Quote
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
