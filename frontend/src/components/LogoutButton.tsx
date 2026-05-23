"use client";

import { logout } from "@/lib/auth";

type Props = {
  label: string;
  className?: string;
};

export default function LogoutButton({ label, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={() => logout({ reason: "logout" })}
      className={
        className ||
        "flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#E31E24] text-white font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
      }
    >
      <span className="material-symbols-outlined text-[16px]">logout</span>
      {label}
    </button>
  );
}
