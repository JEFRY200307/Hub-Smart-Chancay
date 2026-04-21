import Link from 'next/link';

export default function ConciergePage() {
  return (
    <div className="bg-surface text-on-surface flex h-screen overflow-hidden antialiased">
      {/* SideNavBar */}
      <nav className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col py-8 gap-2 z-50">
        <div className="px-6 mb-8">
          <h1 className="font-['Manrope'] font-extrabold text-red-700 text-2xl tracking-tighter">CIP Validator</h1>
          <p className="font-['Inter'] text-sm antialiased text-slate-500 mt-1">Institutional Access</p>
        </div>
        <div className="flex flex-col gap-1 w-full font-['Inter'] text-sm antialiased">
          <Link href="/dashboard/validator" className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl px-4 py-3 flex items-center gap-3 hover:translate-x-1 transition-transform duration-200">
            <span className="material-symbols-outlined text-red-700 dark:text-red-500">gavel</span>
            Legal Validator
          </Link>
          {/* Active: Concierge Hub */}
          <Link href="/dashboard/concierge" className="bg-white dark:bg-slate-900 text-red-700 dark:text-red-500 font-semibold rounded-l-xl ml-4 shadow-sm px-4 py-3 flex items-center gap-3 ring-0 transition-transform">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            Concierge Hub
          </Link>
          <Link href="/dashboard/matchmaking" className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl px-4 py-3 flex items-center gap-3 hover:translate-x-1 transition-transform duration-200">
            <span className="material-symbols-outlined text-red-700 dark:text-red-500">groups</span>
            Expert Network
          </Link>
          <Link href="#" className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl px-4 py-3 flex items-center gap-3 hover:translate-x-1 transition-transform duration-200">
            <span className="material-symbols-outlined text-red-700 dark:text-red-500">fact_check</span>
            Compliance
          </Link>
          <Link href="#" className="text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl px-4 py-3 flex items-center gap-3 hover:translate-x-1 transition-transform duration-200 mt-auto">
            <span className="material-symbols-outlined text-red-700 dark:text-red-500">settings</span>
            Settings
          </Link>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="ml-64 flex-1 h-full overflow-y-auto bg-surface p-8 lg:p-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">Articulación Humana</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl">Coordinate securely with CIP Peritos and legal experts to finalize infrastructure compliance.</p>
          </div>
          <button className="bg-primary text-on-primary rounded-full px-6 py-3.5 font-label font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shrink-0 shadow-[0_8px_24px_rgba(185,21,30,0.2)]">
            <span className="material-symbols-outlined text-[20px]">draw</span>
            Solicitar Firma Digital CIP
          </button>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Meeting Scheduler (Col span 8) */}
          <section className="lg:col-span-8 bg-surface-container-low rounded-[2rem] p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-2xl font-bold text-on-surface">Expert Network Scheduler</h3>
              <button className="text-primary font-label font-semibold text-sm hover:underline">View Calendar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expert Card 1 */}
              <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary font-headline font-bold overflow-hidden">
                      <img alt="Portrait of a professional man in a dark suit" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtMiDXiEqoCkOqJdkc_sBunqd28dMceH0nnPqvSTbHdBXN3y1eOe2lS-DVj0d1ig2wJIhdne_qCPhDdJTJ8XzXLKX_0aqck3TtzBSFPV_M_RTz4J3tJFTxYJCHNNDzAwCqJ-JeVCgHdlxwkdSBTJVNUYv_SVjauTTWZ_DrLf4x1MtEqu2_8kK6_j97j1qYghOuR_Yf5Z63_5WJ_EI6w0IG3E_rDQyZZIJoylPteBL9RDKJbgrlYhQukTOlHzVkVTx6-xF1VT49" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Dr. Carlos Mendoza</h4>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">Perito Estructural</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-sm">event_available</span>
                  <span className="text-sm text-secondary font-medium">Next available: Tomorrow, 10:00 AM</span>
                </div>
                <button className="bg-surface-container-lowest text-primary font-bold rounded-xl py-2.5 w-full hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/30">Schedule Session</button>
              </div>
              {/* Expert Card 2 */}
              <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary font-headline font-bold overflow-hidden">
                      <img alt="Portrait of a professional woman in a blazer" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0NsxmZLWaUnuEYKBbsZaPbyk97GEZfiSHhxkuy1DMIWgMiHmTYPC0DZl4YVPCHfl-qt0rdjkZr1RY9zFBONmjG7MrmKvFs4p00zTtTvJVIMIuB9BHbVpEFpf5T6MIbpS3KOc6KlmIrPSmNwVFshD-Un4k2H-c1JxbFu2stv6Lr4Yuw1qgxmWO3jWwz-fB8YNLjjdQC-x2GCizccuBj4vNrny001bivpy-SYlWG_5uQ9MQ82Anvhs2mOjwSmCwawMi6u8Ic1tq" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Lic. Elena Vargas</h4>
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">Asesor Legal Core</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-sm">event_available</span>
                  <span className="text-sm text-secondary font-medium">Next available: Thursday, 14:30 PM</span>
                </div>
                <button className="bg-surface-container-lowest text-primary font-bold rounded-xl py-2.5 w-full hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/30">Schedule Session</button>
              </div>
            </div>
          </section>

          {/* System Notifications (Col span 4) */}
          <section className="lg:col-span-4 bg-surface-container-low rounded-[2rem] p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-on-surface">System Intel</h3>
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-full">3 New</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_12px_rgba(19,29,36,0.03)] border-l-4 border-primary">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">warning</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Digital Signature Expiring</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Your current CIP credentials require renewal within 48 hours for uninterrupted port access.</p>
                    <span className="text-[10px] text-secondary font-medium mt-2 block">10 mins ago</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-xl mt-0.5">task_alt</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Phase 2 Audit Cleared</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Structural review by Dr. Mendoza has been verified and logged to the ledger.</p>
                    <span className="text-[10px] text-secondary font-medium mt-2 block">2 hours ago</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-xl mt-0.5">upload_file</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Documents Requested</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Compliance office requires updated environmental impact assessments for Sector 4.</p>
                    <span className="text-[10px] text-secondary font-medium mt-2 block">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Installation Task Checklist (Col span 12) */}
          <section className="lg:col-span-12 bg-surface-container-low rounded-[2rem] p-8 mt-4">
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-6">Installation Protocol Checklist</h3>
            <div className="flex flex-col">
              <div className="flex items-start gap-4 py-4 border-b border-outline-variant/15 group">
                <div className="w-6 h-6 rounded flex-shrink-0 bg-primary text-on-primary flex items-center justify-center mt-0.5">
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-on-surface line-through opacity-60">Initial Site Perimeter Secured</h4>
                  <p className="text-sm text-on-surface-variant mt-1 opacity-60">Verification of physical boundaries per CIP guidelines.</p>
                </div>
                <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-1 rounded-full opacity-60">Verified</span>
              </div>
              <div className="flex items-start gap-4 py-4 border-b border-outline-variant/15 group">
                <div className="w-6 h-6 rounded flex-shrink-0 bg-surface-container-highest border border-outline-variant/40 mt-0.5 cursor-pointer hover:border-primary transition-colors"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-on-surface">Validate Sensor Calibration Logs</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Submit digital readout logs to the central Concierge node for baseline establishment.</p>
                </div>
                <button className="text-sm font-bold text-primary hover:text-primary-container px-3 py-1">Upload Data</button>
              </div>
              <div className="flex items-start gap-4 py-4 group">
                <div className="w-6 h-6 rounded flex-shrink-0 bg-surface-container-highest border border-outline-variant/40 mt-0.5 cursor-pointer hover:border-primary transition-colors"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-on-surface">Final Legal Sign-off Integration</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Requires active Digital Signature (Firma Digital CIP) to bind installation records to the institutional ledger.</p>
                </div>
                <span className="text-xs font-bold text-secondary-fixed-dim px-3 py-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">lock</span> Blocked</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
