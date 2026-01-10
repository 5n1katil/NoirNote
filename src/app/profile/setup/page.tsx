import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";
import ProfileSetupClient from "./ProfileSetupClient";

export default function ProfileSetupPage() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="p-6 text-sm opacity-70">Yükleniyor...</div>}>
        <ProfileSetupClient />
      </Suspense>
    </AuthGate>
  );
}
