"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import { ensureUserDoc } from "@/lib/userDoc.client";
import { textsTR } from "@/lib/texts.tr";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ SSR/CSR uyumu
  useEffect(() => setMounted(true), []);

  // ✅ next parametresi
  const nextPath = sp.get("next") || "/dashboard";

  // ✅ Provider tek kez oluşturulsun
  const provider = useMemo(() => new GoogleAuthProvider(), []);

  // ✅ Kullanıcı zaten girişliyse login ekranını göstermeden yönlendir
  useEffect(() => {
    if (!mounted) return;
    const { auth } = getFirebaseClient();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists
        try {
          await ensureUserDoc(user);
        } catch (err) {
          console.error("[Login] Error ensuring user doc:", err);
        }
        router.replace(nextPath);
      }
    });

    return () => unsub();
  }, [mounted, router, nextPath]);

  function getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return textsTR.login.emailInUse;
      case "auth/invalid-email":
        return textsTR.login.invalidEmail;
      case "auth/weak-password":
        return textsTR.login.weakPassword;
      case "auth/user-not-found":
        return textsTR.login.userNotFound;
      case "auth/wrong-password":
        return textsTR.login.wrongPassword;
      case "auth/popup-blocked":
        return textsTR.errors.authPopupClosed;
      case "auth/popup-closed-by-user":
        return textsTR.errors.authPopupClosed;
      default:
        return textsTR.errors.authFailed;
    }
  }

  async function onEmailPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError(textsTR.login.emailRequired);
      return;
    }
    if (!password) {
      setError(textsTR.login.passwordRequired);
      return;
    }
    if (password.length < 6) {
      setError(textsTR.login.passwordMinLength);
      return;
    }

    setBusy(true);

    try {
      const { auth } = getFirebaseClient();

      // ✅ Kalıcılık: refresh olunca login düşmesin
      await setPersistence(auth, browserLocalPersistence);

      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      // Ensure user document exists
      if (userCredential.user) {
        await ensureUserDoc(userCredential.user);
      }

      router.replace(nextPath);
    } catch (e: any) {
      console.error("[login] email/password auth error", e);
      const msg = getErrorMessage(e?.code) || e?.message || textsTR.errors.authFailed;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleSignIn() {
    setError(null);
    setBusy(true);

    try {
      const { auth } = getFirebaseClient();

      // ✅ Kalıcılık: refresh olunca login düşmesin
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithPopup(auth, provider);

      // Ensure user document exists
      if (userCredential.user) {
        await ensureUserDoc(userCredential.user);
      }

      router.replace(nextPath);
    } catch (e: any) {
      console.error("[login] signIn error", e);
      const msg = getErrorMessage(e?.code) || e?.message || textsTR.errors.authFailed;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-12 w-64 rounded-lg bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-lg shadow-black/20">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{textsTR.login.title}</h1>
          <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8">{textsTR.login.subtitle}</p>

          <form onSubmit={onEmailPasswordSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
                {textsTR.login.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={textsTR.login.emailPlaceholder}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all"
                disabled={busy}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-300 mb-2">
                {textsTR.login.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder={textsTR.login.passwordPlaceholder}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all"
                disabled={busy}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy
                ? isSignUp
                  ? textsTR.login.signingUp
                  : textsTR.login.signingIn
                : isSignUp
                ? textsTR.login.signUpButton
                : textsTR.login.signInButton}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500">veya</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={busy}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-6 py-3 text-sm font-semibold hover:bg-zinc-900 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {textsTR.login.googleButton}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isSignUp ? textsTR.login.toggleToSignIn : textsTR.login.toggleToSignUp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
