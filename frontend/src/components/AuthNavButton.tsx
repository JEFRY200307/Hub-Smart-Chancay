"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { getAccessToken } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

type Props = {
  loginLabel: string;
  logoutLabel: string;
};

export default function AuthNavButton({ loginLabel, logoutLabel }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getAccessToken());
  }, []);

  if (loggedIn) {
    return (
      <LogoutButton
        label={logoutLabel}
        className="bg-[#b91c1c] text-white px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-widest hover:opacity-90 inline-block"
      />
    );
  }

  return (
    <Link
      href="/login"
      className="bg-[#b91c1c] text-white px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-transform inline-block"
    >
      {loginLabel}
    </Link>
  );
}
