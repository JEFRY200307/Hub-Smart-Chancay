"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ProcessingPage() {
  const [showModal, setShowModal] = useState(false);

  // Muestra el modal de inicio de sesión automáticamente después de completar el análisis
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 3500); // Aparece a los 3.5 segundos limitando la vista
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-white relative">
      {/* TopNavBar Shared Component */}
      <nav className="bg-[#f6f9ff]/80 dark:bg-[#131d24]/80 backdrop-blur-xl fixed top-0 w-full z-40 shadow-[0_12px_40px_rgba(19,29,36,0.06)]">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-xl font-extrabold font-headline text-[#b9151e] dark:text-[#dd3333] tracking-tighter">Vanguard AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-headline">
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#dd3333] transition-colors duration-200" href="#">Operations</Link>
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#dd3333] transition-colors duration-200" href="#">Regulatory</Link>
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#dd3333] transition-colors duration-200" href="#">Logistics</Link>
            <Link className="text-[#b9151e] dark:text-[#dd3333] font-bold border-b-2 border-[#b9151e] pb-1 hover:text-[#dd3333] transition-colors duration-200" href="#">Analytics</Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 dark:text-slate-400 font-medium hover:text-[#dd3333] transition-colors duration-200 font-label text-sm">System Status</button>
            <Link href="/onboarding" className="bg-primary text-on-primary rounded-xl px-6 py-2.5 font-headline font-bold tracking-tight text-sm hover:bg-primary-container transition-colors duration-200">
              New Analysis
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-grow pt-32 pb-24 px-8 relative flex items-center justify-center overflow-hidden ${showModal ? 'blur-sm grayscale-[30%] pointer-events-none' : 'transition-all duration-700'}`}>
        {/* Abstract Stylized Map Background */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDnYhci-RAF5NnCk356b2MBUp2ekrfzV_23tNZKRRwyKeWh0TC4YxkPk1yB4EnmlB68WhFy00aBb3W0qJsK8qwDsolSPYfGmDgYf5TyDFL6hpyl6ACmP4RuO7Ccal58MANDV1yoMLi7xoELAiV2rX6rliKzCZKtxbmSIqG6TJ7OLrmBf8K5huOyRi9r_uugJxBLWJ0LTJxKjHLCYjkDsAL2rBhcEal_tixAxq4BGw_fWXa1O7T7UejXAEOHzuB8_jz2f4ILXFGA')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        </div>

        {/* AI Terminal Container (Dark Glassmorphism) */}
        <div className="relative z-10 w-full max-w-5xl bg-on-surface text-surface rounded-xl p-10 md:p-16 shadow-[0_24px_80px_rgba(19,29,36,0.15)] overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle at top right, #b9151e 0%, transparent 60%)" }}></div>
          
          <div className="relative z-20 flex flex-col gap-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <img alt="CIP-LIMA Logo" className="h-12 w-auto bg-surface-container-lowest p-2 rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTnNIGrn5LeqFyvuimt2sNMRh6wti6DTbJETRXTpvRDl7qOancqNniViT6oXg5_QDBvOPoGjiP6Ut7jorcYTArU-KzACkdroKi7L08pb0ucdDQh0HrPYk8PtM8zSxrc92Ppz3S2kDthBX6PIduaPg5sk_muzl1G7my-x1pnezeSmVF6gRHzco9gEkuXi3J_ptpXa-cYHf6LtRM6fa_z5aXgiT3PkqhucjHsSWpZ4iwD4T8kcEWR3xvbKYjxMqjVdMjJzr5ctAe" />
                <div className="flex flex-col">
                  <span className="font-headline font-bold text-sm text-surface-dim tracking-widest uppercase">Motor RAG</span>
                  <span className="font-headline font-extrabold text-2xl text-surface">Procesamiento IA</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-inverse-surface px-4 py-2 rounded-full border border-outline-variant/10">
                <span className="relative flex h-3 w-3">
                  <span className={showModal ? "relative inline-flex rounded-full h-3 w-3 bg-secondary" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${showModal ? "hidden" : "bg-primary"}`}></span>
                </span>
                <span className="font-label text-sm text-surface-dim">{showModal ? "Sistema en Pausa" : "Sistema En Línea"}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-8">
              <span className={`material-symbols-outlined text-6xl text-primary-container mb-6 ${showModal ? '' : 'animate-pulse'}`} data-icon="memory" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
              <h1 className="font-headline font-extrabold text-4xl md:text-6xl text-surface tracking-tight max-w-3xl leading-tight">
                {showModal ? "Análisis Protegido" : "Analizando Viabilidad"} <br/><span className="text-primary-container">Institucional</span>
              </h1>
            </div>

            <div className="flex flex-col gap-8 mt-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <h3 className="font-body text-base md:text-lg text-surface-dim font-medium max-w-2xl">
                    Consultando normativa ZEEP (Ley N°32449, MINCETUR)...
                  </h3>
                  <span className="font-headline font-bold text-primary-container text-xl">100%</span>
                </div>
                <div className="w-full bg-secondary-container/20 h-3 overflow-hidden">
                  <div className="bg-primary h-full w-full"></div>
                </div>
                <div className="flex justify-end">
                  <span className="bg-tertiary-container text-on-tertiary-fixed rounded-full px-3 py-1 text-xs font-label font-bold tracking-wide">COMPLETADO</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <h3 className="font-body text-base md:text-lg text-surface font-semibold max-w-2xl">
                    Calculando viabilidad y armando reporte analítico final...
                  </h3>
                  <span className="font-headline font-bold text-surface text-xl">100%</span>
                </div>
                <div className="w-full bg-secondary-container/20 h-3 overflow-hidden">
                  <div className={`bg-primary-container h-full ${showModal ? 'w-full' : 'w-[85%] relative overflow-hidden'}`}>
                    {!showModal && <div className="absolute inset-0 bg-white/20 w-full animate-[translateX_2s_infinite]"></div>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <span className={`rounded-full px-3 py-1 text-xs font-label font-bold tracking-wide flex items-center gap-1 ${showModal ? 'bg-tertiary-container text-on-tertiary-fixed' : 'bg-surface/10 text-surface'}`}>
                    {showModal ? 'COMPLETADO' : <><span className="material-symbols-outlined text-[14px]">sync</span> EN PROCESO</>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pop-up Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
            <div className="bg-[#b9151e] p-6 text-center">
              <span className="material-symbols-outlined text-white text-5xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
              <h2 className="text-white font-headline text-2xl font-bold">Datos Protegidos</h2>
            </div>
            <div className="p-8 pb-10">
              <p className="text-slate-600 font-body text-center mb-8 leading-relaxed">
                El análisis está listo. Por protocolos de confidencialidad institucional, debe verificar la titularidad de la empresa.
              </p>
              <div className="flex flex-col gap-4">
                <Link href="/login" className="w-full bg-[#131d24] text-white py-4 rounded-lg font-headline font-bold text-center hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">login</span>
                  Iniciar Sesión
                </Link>
                <div className="text-center text-sm mt-2">
                  <span className="text-slate-500">¿Operador Nuevo? </span>
                  <Link href="/login?register=true" className="text-[#b9151e] font-bold hover:underline">
                    Verificar y Registrar Empresa
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Shared Component */}
      <footer className={`bg-[#ebf5ff] dark:bg-[#0a0f14] w-full py-12 mt-auto ${showModal ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-7xl mx-auto">
          <div className="mb-6 md:mb-0">
            <span className="font-headline font-bold text-[#131d26] dark:text-white text-lg">Vanguard AI</span>
            <p className="font-body text-sm tracking-wide text-slate-500 dark:text-slate-400 mt-2">© 2024 Chancay Port Authorities | AI Vanguard Division</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link className="font-body text-sm tracking-wide text-slate-500 dark:text-slate-400 hover:text-[#b9151e] underline transition-all" href="#">Terms of Service</Link>
            <Link className="font-body text-sm tracking-wide text-slate-500 dark:text-slate-400 hover:text-[#b9151e] underline transition-all" href="#">Technical Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
