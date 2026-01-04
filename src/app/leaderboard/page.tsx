import { AuthGate } from "@/components/AuthGate";
import { AuthedShell } from "@/components/AuthedShell";
import { textsTR } from "@/lib/texts.tr";

export default function LeaderboardPage() {
  return (
    <AuthGate>
      <AuthedShell title={textsTR.leaderboard.title}>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {textsTR.leaderboard.placeholder}
        </p>
      </AuthedShell>
    </AuthGate>
  );
}

