"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ SSR/CSR uyumu
  useEffect(() => setMounted(true), []);

  // 🔍 Debug: Log Firebase env vars and host on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
      console.log("[debug] Firebase Config (on mount):", {
        host: window.location.host,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_API_KEY: apiKey ? `${apiKey.substring(0, 6)}...` : "undefined",
      });
    }
  }, []);

  // ✅ next parametresi
  const nextPath = sp.get("next") || "/dashboard";

  // ✅ Provider tek kez oluşturulsun
  const provider = useMemo(() => new GoogleAuthProvider(), []);

  // ✅ Kullanıcı zaten girişliyse login ekranını göstermeden yönlendir
  useEffect(() => {
    if (!mounted) return;
    const { auth } = getFirebaseClient();

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace(nextPath);
    });

    return () => unsub();
  }, [mounted, router, nextPath]);

  async function onGoogleSignIn() {
    // 🔍 Debug: Log Firebase env vars before sign-in
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
    console.log("[debug] Firebase Config (before sign-in):", {
      host: window.location.host,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_API_KEY: apiKey ? `${apiKey.substring(0, 6)}...` : "undefined",
    });

    setError(null);
    setBusy(true);

    try {
      const { auth } = getFirebaseClient();

      // ✅ Kalıcılık: refresh olunca login düşmesin
      await setPersistence(auth, browserLocalPersistence);

      await signInWithPopup(auth, provider);

      router.replace(nextPath);
    } catch (e: any) {
      console.error("[login] signIn error", e);
      const msg =
        e?.code === "auth/popup-blocked"
          ? "Popup engellenmiş görünüyor. Tarayıcıda pop-up iznini açıp tekrar dene."
          : e?.code === "auth/popup-closed-by-user"
          ? "Popup kapatıldı. Tekrar deneyebilirsin."
          : e?.message || "Giriş sırasında bir hata oluştu.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ height: 44, width: 260, borderRadius: 10, background: "rgba(0,0,0,0.08)" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Giriş</h1>

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={busy}
        style={{
          height: 44,
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "white",
          cursor: busy ? "not-allowed" : "pointer",
          fontWeight: 600,
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Açılıyor..." : "Google ile giriş yap"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            borderRadius: 10,
            background: "rgba(255,0,0,0.08)",
            border: "1px solid rgba(255,0,0,0.2)",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
