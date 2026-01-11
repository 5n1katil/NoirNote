import AuthGate from "@/components/AuthGate";
import { AuthedShell } from "@/components/AuthedShell";
import { textsTR } from "@/lib/texts.tr";
import PublicProfileClient from "./PublicProfileClient";
import { notFound } from "next/navigation";
import { getUserDoc } from "@/lib/userDoc.client";
import { getFirebaseClient } from "@/lib/firebase.client";

type PublicProfilePageProps = {
  params: Promise<{ uid: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { uid } = await params;
  
  // Verify user exists
  const userDoc = await getUserDoc(uid);
  if (!userDoc) {
    notFound();
  }

  return (
    <AuthGate>
      <AuthedShell title={userDoc.detectiveUsername || textsTR.profile.title}>
        <PublicProfileClient targetUid={uid} />
      </AuthedShell>
    </AuthGate>
  );
}
