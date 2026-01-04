"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseClient } from "@/lib/firebase.client";
import { textsTR } from "@/lib/texts.tr";

type AuthedShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AuthedShell({ title, children }: AuthedShellProps) {
  const router = useRouter();
  const fb = getFirebaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!fb) return;
    const unsub = onAuthStateChanged(fb.auth, (u) => setUser(u));
    return () => unsub();
  }, [fb]);

  async function handleLogout() {
    if (!fb) return;
    setBusy(true);
    try {
      await signOut(fb.auth);
      router.replace("/login");
    } finally {
      setBusy(false);
    }
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/50">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold text-white dark:bg-white dark:text-black">
              {textsTR.common.appName.slice(0, 1)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{textsTR.common.appName}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                {user?.displayName || user?.email || textsTR.common.loading}
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {textsTR.nav.dashboard}
            </Link>
            <Link
              href="/profile"
              className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {textsTR.nav.profile}
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {textsTR.nav.leaderboard}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {busy ? textsTR.common.loading : textsTR.nav.logout}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

