import SimulationWizard from "@/components/SimulationWizard";
import BrandLogo from "@/components/BrandLogo";
import { Link } from "@/navigation";

export default function SimulacionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="flex justify-between items-center px-8 py-5 border-b border-[#D7B56D]/20 bg-white">
        <BrandLogo href="/" height={36} priority />
        <Link href="/login" className="text-xs font-bold uppercase text-[#2A2A29] hover:text-[#E31E24]">
          Acceso institucional
        </Link>
      </nav>
      <main className="py-12 px-6">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <p className="text-[#D7B56D] font-black text-[10px] uppercase tracking-[0.35em] mb-2">COMEX.AI</p>
          <h1 className="text-4xl font-black text-[#2A2A29] uppercase tracking-tight italic">
            Simulador de elegibilidad ZEEP
          </h1>
          <p className="text-slate-600 mt-4 text-sm max-w-xl mx-auto">
            Complete los datos de inversión alineados al motor de scoring del backend. Los resultados se guardan en Supabase.
          </p>
        </div>
        <SimulationWizard />
      </main>
    </div>
  );
}
