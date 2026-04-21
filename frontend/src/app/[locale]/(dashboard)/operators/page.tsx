import React from 'react';
import Image from 'next/image';

export default function OperatorsPage() {
  return (
    <main className="pt-24 pb-20 lg:ml-64 w-full lg:w-[calc(100%-16rem)]">
      {/* Hero Section */}
      <section className="px-8 mb-12">
        <div className="max-w-7xl mx-auto py-16 px-12 rounded-xl bg-gradient-to-br from-primary to-primary-container relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="relative z-10 max-w-2xl">
            <span className="text-on-primary-container font-label text-[0.6875rem] uppercase tracking-[0.05em] mb-4 block">Institutional Framework</span>
            <h1 className="text-on-primary text-5xl md:text-6xl font-bold tracking-[-0.02em] mb-6 leading-tight">MINCETUR Endorsed Private Operators</h1>
            <p className="text-on-primary-container text-lg leading-relaxed max-w-xl opacity-90">Access the centralized directory of certified logistics partners and port service providers approved for operations within the Chancay Megaport ecosystem.</p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/10 w-full md:w-80">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-white/60 text-xs font-label uppercase">Verified Entities</span>
                <span className="text-white text-xl font-bold">142</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-white/60 text-xs font-label uppercase">Pending Reviews</span>
                <span className="text-white text-xl font-bold">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs font-label uppercase">Trust Index</span>
                <span className="text-secondary text-xl font-bold">99.8%</span>
              </div>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Filters and Content */}
      <section className="px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Side Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-28 space-y-8">
            <div>
              <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-4">Operator Status</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-outline rounded flex items-center justify-center group-hover:border-secondary transition-colors">
                    <div className="w-2.5 h-2.5 bg-secondary rounded-sm"></div>
                  </div>
                  <span className="text-sm text-on-surface font-medium">MINCETUR Verified</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-outline rounded flex items-center justify-center group-hover:border-secondary transition-colors"></div>
                  <span className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Audit in Progress</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-outline rounded flex items-center justify-center group-hover:border-secondary transition-colors"></div>
                  <span className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Strategic Partner</span>
                </label>
              </div>
            </div>
            <div className="pt-8 border-t border-outline-variant/15">
              <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-4">Service Category</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm rounded bg-surface-container-high text-on-surface font-semibold">All Operators</button>
                <button className="w-full text-left px-3 py-2 text-sm rounded text-on-surface-variant hover:bg-surface-container-low transition-colors">Maritime Logistics</button>
                <button className="w-full text-left px-3 py-2 text-sm rounded text-on-surface-variant hover:bg-surface-container-low transition-colors">Customs Brokerage</button>
                <button className="w-full text-left px-3 py-2 text-sm rounded text-on-surface-variant hover:bg-surface-container-low transition-colors">Heavy Transport</button>
              </div>
            </div>
            <div className="pt-8 border-t border-outline-variant/15">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <span className="material-symbols-outlined text-secondary mb-2">gavel</span>
                <p className="text-xs text-on-surface leading-relaxed">All operators listed are subject to <strong>MINCETUR Compliance</strong> Regulation 2024-X.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Operator List */}
        <div className="flex-grow space-y-6">
          {/* Operator Card 1 */}
          <article className="bg-surface-container-lowest p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-shadow duration-300 relative group">
            <div className="w-full md:w-48 h-32 md:h-auto bg-surface-container-high rounded overflow-hidden flex-shrink-0">
              <img alt="Logistics center" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH9brUB-ODFk6U_DLjAqZdNy14DsGaWAIZxI-WEh-L8WrlnjHd2p1wFFjPTMVlsQdK3NGSdT7ryENolDaZwUXiH02vCt7hzArpI8uAyQfXzQNXzR1eFkqYhqAY7_O4GfR34S7Hkv0e9V4JmdH5zraZsYbLZq-mqBNpvwiPcZFwIOhZuYkm5sC4vLIvolqbR15FQ7RnV45TS6ONawJfsQPjDW3B8lLR_NCblpR5vd-QevqRm2AJfIW8xcHKPGcT58Gfv1AMXfgfR7c"/>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-on-surface">Pacific Nexus Logistics</h2>
                  <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified">verified</span>
                </div>
                <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed text-[0.625rem] font-label uppercase tracking-wider rounded">Tier 1 Partner</span>
              </div>
              <p className="text-on-surface-variant text-sm mb-4 line-clamp-2 leading-relaxed">Specializing in multi-modal heavy cargo and deep-sea port operations. Holding ISO 9001 and MINCETUR Logistics Excellence certifications for 2024.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-surface-container rounded-full text-[0.6875rem] font-medium text-primary">Heavy Lift</span>
                <span className="px-3 py-1 bg-surface-container rounded-full text-[0.6875rem] font-medium text-primary">Warehouse Solutions</span>
                <span className="px-3 py-1 bg-surface-container rounded-full text-[0.6875rem] font-medium text-primary">Customs Clearance</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex gap-4">
                  <div className="flex items-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm mr-1">location_on</span>
                    Chancay North Zone
                  </div>
                  <div className="flex items-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm mr-1">star</span>
                    4.9 Rating
                  </div>
                </div>
                <button className="text-secondary font-semibold text-sm hover:underline flex items-center">
                  View Full Profile
                  <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </article>

          {/* Load More */}
          <div className="flex justify-center pt-8">
            <button className="px-8 py-3 bg-surface-container-high text-primary font-bold rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-2">
              Show More Operators
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
