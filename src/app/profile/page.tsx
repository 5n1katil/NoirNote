import { AuthGate } from "@/components/AuthGate";
import { AuthedShell } from "@/components/AuthedShell";
import { textsTR } from "@/lib/texts.tr";

export default function ProfilePage() {
  return (
    <AuthGate>
      <AuthedShell title={textsTR.profile.title}>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {textsTR.profile.placeholder}
        </p>
      </AuthedShell>
    </AuthGate>
  );
}

