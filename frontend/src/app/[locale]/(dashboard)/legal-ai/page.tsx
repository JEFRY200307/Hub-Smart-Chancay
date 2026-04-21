import React from 'react';

export default function LegalAIPage() {
  return (
    <main className="lg:ml-64 p-8 min-h-[calc(100vh-80px)] flex flex-col pt-24 w-full">
      {/* AI Assistant Header Area */}
      <header className="max-w-5xl mx-auto w-full mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined text-3xl" data-icon="gavel" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            </div>
            <div>
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-secondary">Institutional AI</span>
              <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">Legal Assistant</h1>
            </div>
          </div>
          <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed">
            Access expert-grade preliminary guidance on Megaport regulations, Special Economic Zone (ZEEP) compliance, and international trade laws.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-surface-container-low rounded-lg border border-outline-variant/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Operational</span>
          </div>
        </div>
      </header>

      {/* Chat Workspace */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Chat Window */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col overflow-hidden">
          {/* Chat Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
            
            {/* AI Intro Message */}
            <div className="flex gap-4 max-w-3xl">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" data-icon="smart_toy">smart_toy</span>
              </div>
              <div className="space-y-3">
                <div className="bg-surface-container-low p-5 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-on-surface leading-relaxed">
                  <p className="mb-3">Welcome to the <strong>Chancay Megaport Legal Gateway</strong>. I am your specialized AI counselor for maritime and logistics regulations.</p>
                  <p>How can I assist your investment or operational strategy today?</p>
                </div>
                <span className="text-[0.6rem] uppercase tracking-widest text-outline ml-1 block">Legal Assistant • Just now</span>
              </div>
            </div>

            {/* Pre-set Queries (Bento-lite) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-14 max-w-3xl">
              <button className="text-left p-4 bg-white border border-outline-variant/10 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 group">
                <span className="material-symbols-outlined text-secondary group-hover:text-white mb-2" data-icon="account_balance">account_balance</span>
                <h4 className="font-bold text-sm mb-1">Tax law in ZEEP</h4>
                <p className="text-xs opacity-70">Review incentives for foreign tech investments.</p>
              </button>
              <button className="text-left p-4 bg-white border border-outline-variant/10 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 group">
                <span className="material-symbols-outlined text-secondary group-hover:text-white mb-2" data-icon="description">description</span>
                <h4 className="font-bold text-sm mb-1">Land acquisition process</h4>
                <p className="text-xs opacity-70">Regulatory framework for industrial property.</p>
              </button>
            </div>

            {/* Example User Message */}
            <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex-shrink-0 flex items-center justify-center text-white">
                <span className="material-symbols-outlined" data-icon="person">person</span>
              </div>
              <div className="space-y-2 text-right">
                <div className="bg-primary text-white p-5 rounded-tl-2xl rounded-br-2xl rounded-bl-2xl leading-relaxed">
                  <p>What are the specific environmental requirements for hazardous cargo storage in the northern terminal area?</p>
                </div>
                <span className="text-[0.6rem] uppercase tracking-widest text-outline mr-1 block">Institutional User • 2m ago</span>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex gap-4 max-w-3xl">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" data-icon="smart_toy">smart_toy</span>
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-low p-5 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-on-surface leading-relaxed">
                  <p className="mb-3">According to the <strong>Supreme Decree N° 015-2023-MTC</strong> and the Port Environmental Management Plan (PIGA):</p>
                  <ul className="space-y-2 list-disc list-inside ml-2 text-sm">
                    <li>Secondary containment systems must exceed 110% of total tank volume.</li>
                    <li>Specific seismic damping sensors are mandatory for Type 3 hazardous materials.</li>
                    <li>Distance from the ZEEP residential buffer must be at least 1,200 meters.</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 flex gap-4">
                    <button className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
                      <span className="material-symbols-outlined text-sm" data-icon="download">download</span> DOWNLOAD DECREE PDF
                    </button>
                  </div>
                </div>
                <span className="text-[0.6rem] uppercase tracking-widest text-outline ml-1 block">Legal Assistant • Just now</span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-outline-variant/10">
            <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 bg-surface-container rounded-xl flex items-center px-4 focus-within:ring-2 ring-primary/20 transition-all">
                <textarea className="w-full bg-transparent border-none focus:ring-0 py-4 resize-none text-sm placeholder:text-outline outline-none" placeholder="Inquire about port law, tax exemptions, or licensing..." rows={1}></textarea>
                <div className="flex gap-1 py-2">
                  <button className="p-2 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined" data-icon="attach_file">attach_file</span>
                  </button>
                </div>
              </div>
              <button className="w-12 h-12 bg-secondary text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-secondary/20 hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined" data-icon="send">send</span>
              </button>
            </div>
            <p className="text-center text-[0.625rem] text-outline mt-4 uppercase tracking-widest">
              AI guidance is preliminary. Consult the MINCETUR Legal Division for certified documentation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
