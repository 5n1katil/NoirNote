import { notFound } from "next/navigation";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { AuthedShell } from "@/components/AuthedShell";
import { textsTR } from "@/lib/texts.tr";
import { getCaseById } from "@/lib/cases";
import { getText } from "@/lib/text-resolver";
import CaseClient from "./CaseClient";

type CasePageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CasePage({ params }: CasePageProps) {
  const { caseId } = await params;
  const caseData = getCaseById(caseId);

  if (!caseData) {
    notFound();
  }

  return (
    <AuthGate>
      <AuthedShell title={getText(caseData.titleKey)}>
        <div className="space-y-4 sm:space-y-6">
          {/* Header with back button and difficulty */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/dashboard"
                className="text-base sm:text-sm text-zinc-400 hover:text-white transition-colors"
              >
                ← {textsTR.common.back}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-xs font-medium text-zinc-400">
                {textsTR.difficulty.label}
              </span>
              <span className="text-base sm:text-sm font-medium text-zinc-300">
                {textsTR.difficulty[caseData.difficulty]}
              </span>
            </div>
          </div>

          {/* Case content (client component for grid interactions) */}
          <CaseClient caseData={caseData} />
        </div>
      </AuthedShell>
    </AuthGate>
  );
}

