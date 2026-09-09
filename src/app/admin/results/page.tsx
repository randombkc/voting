import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/session";

const prisma = new PrismaClient();

export default async function AdminResultsPage() {
  if (!(await verifyAdminSession())) redirect("/admin/login");

  const session = await prisma.votingSession.findFirst({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { updatedAt: "desc" },
  });

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Batch 2023</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-gray-900">Results</h1>
        <p className="mt-6 border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">No open or closed voting session is available.</p>
      </div>
    );
  }

  const [positions, voteCounts, eligibleVoters, submittedVoters] = await Promise.all([
    prisma.position.findMany({
      where: { votingSessionId: session.id },
      orderBy: { displayOrder: "asc" },
      select: {
        name: true,
        candidates: { select: { id: true, name: true }, orderBy: { displayOrder: "asc" } },
      },
    }),
    prisma.vote.groupBy({
      by: ["candidateId"],
      where: { votingSessionId: session.id },
      _count: { _all: true },
    }),
    prisma.voterParticipation.count({ where: { votingSessionId: session.id, eligible: true } }),
    prisma.voterParticipation.count({ where: { votingSessionId: session.id, hasVoted: true } }),
  ]);

  const counts = new Map(voteCounts.map((item) => [item.candidateId, item._count._all]));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 border-b border-gray-900 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Batch 2023</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-gray-900">Results</h1>
          <p className="mt-2 text-sm text-gray-600">{session.name}</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-flex border border-gray-900 px-3 py-1 text-xs font-bold uppercase tracking-widest">{session.status}</span>
          <p className="mt-2 text-sm text-gray-600">{submittedVoters} of {eligibleVoters} eligible voters submitted</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6">
        {positions.map((position) => (
          <section key={position.name} className="border border-gray-300 bg-white p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Position</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-gray-900">{position.name}</h2>
            <div className="mt-6 divide-y divide-gray-200">
              {position.candidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between gap-4 py-4">
                  <span className="font-medium text-gray-800">{candidate.name}</span>
                  <strong className="text-lg text-amber-700">{counts.get(candidate.id) ?? 0} <span className="text-xs font-semibold uppercase text-gray-500">votes</span></strong>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
