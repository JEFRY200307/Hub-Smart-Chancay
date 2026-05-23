"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { getAccessToken } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login?next=dashboard");
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Verificando sesión…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
