"use client";

import LegalChat from "@/components/LegalChat";
import { useEffect } from "react";
import { useRouter } from "@/navigation";
import { getAccessToken } from "@/lib/auth";

export default function LegalAIPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) {
      router.push("/login?next=/legal-ai");
    }
  }, [router]);

  return (
    <main className="p-6 min-h-screen w-full max-w-7xl mx-auto bg-slate-50">
      <header className="max-w-6xl mx-auto mb-6">
        <p className="text-[#D7B56D] text-[10px] font-black uppercase tracking-[0.3em]">COMEX.AI · Asesor legal ZEEP</p>
        <h1 className="text-3xl font-black text-[#2A2A29] tracking-tight">Asesor Legal IA</h1>
      </header>
      <LegalChat />
    </main>
  );
}
