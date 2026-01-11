import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { AuthedShell } from "@/components/AuthedShell";
import { textsTR } from "@/lib/texts.tr";
import { cases } from "@/lib/cases";
import { getText } from "@/lib/text-resolver";

export default function DashboardPage() {
  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <AuthGate>
      <AuthedShell title={textsTR.dashboard.title}>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <span className="text-3xl sm:text-3xl">📋</span>
              {textsTR.cases.list.title}
            </h2>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="group rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20 transition-all duration-300"
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-white transition-colors break-words">
                          {getText(caseItem.titleKey)}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(caseItem.difficulty)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {textsTR.difficulty[caseItem.difficulty]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                      <div className="text-sm text-zinc-500 break-words">
                        {caseItem.suspects.length} şüpheli • {caseItem.locations.length} konum • {caseItem.weapons.length} silah
                      </div>
                      <Link
                        href={`/case/${caseItem.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-white text-black px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-lg shadow-black/20"
                      >
                        {textsTR.cases.list.startButton}
                        <span className="ml-2">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthedShell>
    </AuthGate>
  );
}
