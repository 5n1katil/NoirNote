"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import { textsTR } from "@/lib/texts.tr";

type AuthedShellProps = {
  title: string;
  children: ReactNode;
};

type NavItem = { href: string; label: string };

export function AuthedShell({ title, children }: AuthedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth } = getFirebaseClient();

  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  const nav = useMemo<NavItem[]>(
    () => [
      { href: "/dashboard", label: textsTR?.nav?.dashboard ?? "Gösterge Paneli" },
      { href: "/profile", label: textsTR?.nav?.profile ?? "Profil" },
      { href: "/leaderboard", label: textsTR?.nav?.leaderboard ?? "Liderlik Tablosu" },
    ],
    []
  );

  async function onLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  const displayName = user?.displayName || user?.email || "Kullanıcı";
  const photoURL = user?.photoURL || "";

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          background: "rgba(0,0,0,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "white",
              minWidth: 180,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "white",
                color: "black",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              N
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800 }}>NoirNote</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>5N 1Dedektif</div>
            </div>
          </Link>

          <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    color: active ? "white" : "rgba(255,255,255,0.7)",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              title={displayName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                maxWidth: 260,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.12)",
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                {photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoURL} alt="" style={{ width: "100%", height: "100%" }} />
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 900 }}>
                    {(displayName?.[0] || "K").toUpperCase()}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.9)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {textsTR?.nav?.logout ?? "Çıkış yap"}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px", color: "white" }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0 }}>{title}</h1>
        <div style={{ marginTop: 14 }}>{children}</div>
      </main>
    </div>
  );
}
