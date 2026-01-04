"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { getFirebaseClient } from "@/lib/firebase.client";
import { textsTR } from "@/lib/texts.tr";

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();

  const fb = getFirebaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(() => (fb ? true : false));

  useEffect(() => {
    if (!fb) return;
    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, [fb]);

  useEffect(() => {
    if (checking) return;
    if (!fb) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [checking, fb, user, router, pathname]);

  if (checking) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {textsTR.common.loading}
        </p>
      </div>
    );
  }

  if (!fb) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {textsTR.errors.configMissing}
        </p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

