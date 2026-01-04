"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import { ensureUserDoc } from "@/lib/userDoc.client";
import { textsTR } from "@/lib/texts.tr";

type LoginClientProps = {
  nextPath: string;
};

function isPopupClosedError(e: unknown): boolean {
  const code = (e as { code?: unknown } | null)?.code;
  return (
    code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
  );
}

export default function LoginClient({ nextPath }: LoginClientProps) {
  const router = useRouter();
  const fb = getFirebaseClient();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fb) return;
    const unsub = fb.auth.onAuthStateChanged((user) => {
      if (user) router.replace(nextPath);
    });
    return () => unsub();
  }, [fb, router, nextPath]);

  async function handleGoogleSignIn() {
    if (!fb) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithPopup(fb.auth, fb.googleProvider);
      await ensureUserDoc(result.user);
      router.replace(nextPath);
    } catch (e) {
      setError(
        isPopupClosedError(e) ? textsTR.errors.authPopupClosed : textsTR.errors.authFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-20">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">{textsTR.login.title}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {textsTR.login.subtitle}
          </p>

          {!fb ? (
            <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
              {textsTR.errors.configMissing}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {busy ? textsTR.login.signingIn : textsTR.login.googleButton}
              </button>

              {error ? (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

