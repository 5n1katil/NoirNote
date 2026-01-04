import { AuthGate } from "@/components/AuthGate";
import { AuthedShell } from "@/components/AuthedShell";
import { textsTR } from "@/lib/texts.tr";

export default function DashboardPage() {
  return (
    <AuthGate>
      <AuthedShell title={textsTR.dashboard.title}>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {textsTR.dashboard.placeholder}
        </p>
      </AuthedShell>
    </AuthGate>
  );
}

