"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EligibilityResults from "@/components/EligibilityResults";
import { Link } from "@/navigation";

function ResultsContent() {
  const params = useSearchParams();
  const [session, setSession] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = params.get("session");
    const fromStorage =
      typeof window !== "undefined" ? localStorage.getItem("last_simulation_session") : null;
    setSession(fromUrl || fromStorage);
  }, [params]);

  if (!session) {
    return (
      <div className="pt-32 px-8 text-center">
        <p className="text-[#2A2A29] mb-6">No hay sesión de simulación. Inicie un diagnóstico primero.</p>
        <Link href="/simulacion" className="bg-[#E31E24] text-white px-6 py-3 rounded-lg font-bold uppercase text-xs">
          Ir al simulador
        </Link>
      </div>
    );
  }

  return <EligibilityResults sessionId={session} />;
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <Suspense fallback={<p className="p-12 text-center animate-pulse">Cargando resultados...</p>}>
        <ResultsContent />
      </Suspense>
    </div>
  );
}
