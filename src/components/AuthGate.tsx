"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import { getUserDoc } from "@/lib/userDoc.client";
import { textsTR } from "@/lib/texts.tr";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebaseClient();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      // Allow access to profile setup page
      if (pathname === "/profile/setup") {
        setLoading(false);
        return;
      }

      // Check if profile setup is completed
      try {
        const userDoc = await getUserDoc(user.uid);
        if (!userDoc?.profileSetupCompleted) {
          // Redirect to profile setup if not completed
          router.replace("/profile/setup");
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error("[AuthGate] Error checking profile:", err);
        // On error, allow access but log the issue
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router, pathname]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#999" }}>
        {textsTR.common.loading}
      </div>
    );
  }

  return <>{children}</>;
}
