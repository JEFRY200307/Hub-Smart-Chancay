import Link from 'next/link';

export default function ValidatorPage() {
  return (
    <div className="flex min-h-screen bg-background text-on-background font-body">
      {/* SideNavBar */}
      <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex-col py-8 gap-2 border-r border-surface-variant z-50">
        <div className="px-6 mb-8">
          <h1 className="font-['Manrope'] font-extrabold text-red-700 text-xl tracking-tight">CIP Validator</h1>
          <p className="font-['Inter'] text-sm text-slate-500 mt-1">Institutional Access</p>
        </div>
        <div className="flex flex-col gap-2 flex-grow">
          {/* Active: Legal Validator */}
          <Link href="/dashboard/validator" className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-slate-900 text-red-700 dark:text-red-500 font-semibold rounded-l-xl ml-4 shadow-sm relative group">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            <span className="font-['Inter'] text-sm antialiased">Legal Validator</span>
            <div className="absolute left-0 top-0 w-1 h-full bg-red-700 rounded-r-full group-hover:bg-red-800 transition-colors"></div>
          </Link>
          <Link href="/dashboard/concierge" className="flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl transition-transform duration-200 hover:translate-x-1">
            <span className="material-symbols-outlined">support_agent</span>
            <span className="font-['Inter'] text-sm antialiased">Concierge Hub</span>
          </Link>
          <Link href="/dashboard/matchmaking" className="flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl transition-transform duration-200 hover:translate-x-1">
            <span className="material-symbols-outlined">groups</span>
            <span className="font-['Inter'] text-sm antialiased">Expert Network</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl transition-transform duration-200 hover:translate-x-1">
            <span className="material-symbols-outlined">fact_check</span>
            <span className="font-['Inter'] text-sm antialiased">Compliance</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mx-4 rounded-xl transition-transform duration-200 hover:translate-x-1 mt-auto">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-['Inter'] text-sm antialiased">Settings</span>
          </Link>
        </div>
        <div className="px-6 mt-4">
          <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium text-sm hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Analysis
          </button>
          <div className="mt-6 flex items-center gap-3">
            <img alt="User Profile" className="w-10 h-10 rounded-full object-cover border border-surface-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGqTg-N4khGwvqR4xJviITvvTaCbokfZf5yhjvMie_Nn62L_N9rv7lT7Zyegz_gVtDTaFZGO9pRsT7gPmX-hiZYippUzfVroubIZuJUFSvQQWjSljvZzkCVr993y1rw7ezfx-XrQzWTJJgY_M-01x8yuatLoox19SchEFE0SiLABMjDu68RDkwbLMPoNthszobCg_BqfHKtYEj_vJK9GORTpal9SJ4FMrjhAvCcHEbO-ZgKYIXfvVnpidJrDMmzpEobWR8RnrW" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-on-surface">Alex Mercer</span>
              <span className="text-xs text-on-surface-variant">Lead Counsel</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 pb-32 md:pb-12 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase font-['Inter'] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                AI Powered
              </span>
              <span className="text-sm text-on-surface-variant font-medium">Chancay Nexus Terminal</span>
            </div>
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">Validador Legal Inteligente</h2>
            <p className="font-body text-on-surface-variant max-w-2xl text-lg mt-2">Upload commercial agreements, NDAs, or compliance documents for instant RAG-powered risk assessment and structural optimization.</p>
          </div>
          <div className="flex items-center gap-4 hidden md:flex">
            <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Left Column: Upload & Context (4 cols) */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            {/* Upload Zone */}
            <div className="bg-surface-container rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 hover:bg-surface-container-high transition-colors cursor-pointer group h-64 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface text-center mb-1">Upload Document</h3>
              <p className="font-body text-sm text-on-surface-variant text-center max-w-[200px]">Drag and drop PDF or DOCX files here, or click to browse.</p>
              <div className="mt-6 w-full flex items-center justify-between px-4 py-2 bg-surface-container-lowest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                <span className="text-xs font-medium text-on-surface-variant">Max size: 50MB</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">lock</span>
              </div>
            </div>
            
            {/* Document Context / History */}
            <div className="bg-surface rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headline font-bold text-base text-on-surface">Recent Analysis</h4>
                <button className="text-primary text-sm font-medium hover:underline">View All</button>
              </div>
              <div className="flex flex-col gap-3">
                {/* History Item */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-on-surface truncate">JV_Agreement_Chancay_v3.pdf</p>
                    <p className="font-body text-xs text-on-surface-variant truncate">Analyzed 2 hours ago • High Risk</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                </div>
                {/* History Item */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-on-surface truncate">Supplier_Terms_Q3.docx</p>
                    <p className="font-body text-xs text-on-surface-variant truncate">Analyzed yesterday • Low Risk</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Insights (8 cols) */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            {/* Central Status Banner */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 flex items-center justify-between shadow-[0_4px_24px_rgba(19,29,36,0.03)] border border-surface-container-high relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex flex-col gap-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-headline font-bold text-sm text-primary uppercase tracking-wider">Analysis Complete</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface">JV_Agreement_Chancay_v4_FINAL.pdf</h3>
                <p className="font-body text-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">schedule</span> 14 seconds processing time • 42 pages parsed
                </p>
              </div>
              {/* Overall Score Circular Indicator */}
              <div className="relative w-20 h-20 flex items-center justify-center z-10 hidden sm:flex">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-error" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="62.8" strokeWidth="8"></circle>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-headline font-bold text-xl text-on-surface">75</span>
                  <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest">Score</span>
                </div>
              </div>
            </div>
            
            {/* Results Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Legal Risks (Red) */}
              <div className="bg-error-container/30 rounded-3xl p-6 flex flex-col gap-4 border border-error-container">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-error-container">warning</span>
                    </div>
                    <h4 className="font-headline font-bold text-lg text-on-error-container">Legal Risks</h4>
                  </div>
                  <span className="bg-error text-on-error px-2 py-1 rounded-md text-xs font-bold">3 Critical</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-l-4 border-error">
                    <p className="font-body text-sm font-semibold text-on-surface mb-1">Indemnity Clause Cap</p>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">Section 4.2 lacks a definitive liability cap, exposing the firm to unlimited damages under Peruvian commercial law.</p>
                    <button className="mt-2 text-primary text-xs font-medium hover:underline flex items-center gap-1">
                      View Source <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </button>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-l-4 border-error">
                    <p className="font-body text-sm font-semibold text-on-surface mb-1">Jurisdiction Ambiguity</p>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">Dispute resolution (Sec 9.1) mentions both Lima and Singapore arbitration without clear precedence.</p>
                  </div>
                </div>
              </div>
              
              {/* 2. Tax Opportunities (Green/Teal mapping to Institutional tones) */}
              <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-surface-container-highest rounded-full blur-2xl opacity-50"></div>
                <div className="flex items-center justify-between mb-2 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary">trending_up</span>
                    </div>
                    <h4 className="font-headline font-bold text-lg text-on-surface">Tax &amp; Efficiency</h4>
                  </div>
                  <span className="bg-surface-container-highest text-on-surface px-2 py-1 rounded-md text-xs font-bold">2 Opportunities</span>
                </div>
                <div className="flex flex-col gap-3 z-10">
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-tertiary-container mt-0.5">check_circle</span>
                      <div>
                        <p className="font-body text-sm font-semibold text-on-surface mb-1">Special Economic Zone Benefits</p>
                        <p className="font-body text-xs text-on-surface-variant leading-relaxed">Structure equipment importation under Clause 2.1 to qualify for the Chancay SEZ tax deferral program.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-tertiary-container mt-0.5">check_circle</span>
                      <div>
                        <p className="font-body text-sm font-semibold text-on-surface mb-1">Early Payment Discounts</p>
                        <p className="font-body text-xs text-on-surface-variant leading-relaxed">Leverage Schedule B payment terms to unlock a 2% reduction in overall tariff liabilities.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Optimized Drafting Suggestions (Blue/Neutral mapping to Surface tones) */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(19,29,36,0.03)] border border-surface-container">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface">edit_document</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-lg text-on-surface">Optimized Drafting Suggestions</h4>
                    <p className="font-body text-xs text-on-surface-variant">AI-generated structural improvements</p>
                  </div>
                </div>
                <button className="bg-surface-container-high text-on-surface px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-variant transition-colors flex items-center gap-2 self-start sm:self-auto">
                  <span className="material-symbols-outlined text-[18px]">download</span> Export Report
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {/* Suggestion Block */}
                <div className="bg-surface rounded-2xl p-5 relative">
                  <div className="absolute left-0 top-5 bottom-5 w-1 bg-secondary rounded-r-md"></div>
                  <div className="pl-4 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Original Text (Sec 7.3)</span>
                      <p className="font-body text-sm text-on-surface bg-surface-container p-3 rounded-lg border border-surface-container-highest italic">
                        "The Contractor shall be responsible for delays caused by weather conditions at the port facility."
                      </p>
                    </div>
                    <div className="flex items-center justify-center hidden md:flex">
                      <span className="material-symbols-outlined text-surface-dim text-2xl">arrow_right_alt</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">auto_fix_high</span> Suggested Revision
                      </span>
                      <p className="font-body text-sm text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-surface-variant shadow-sm">
                        "The Contractor shall be liable for delays caused by weather conditions at the port facility, <span className="bg-primary/10 text-primary font-medium px-1 rounded">except in instances formally declared as Force Majeure by the Port Authority</span>."
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 pr-4 gap-2">
                    <button className="text-on-surface-variant text-xs font-medium hover:text-on-surface px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors">Dismiss</button>
                    <button className="bg-primary text-on-primary text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-primary-container transition-colors">Apply Change</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
