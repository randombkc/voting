import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const openSession = await prisma.votingSession.findFirst({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
  });

  const session = openSession ?? await prisma.votingSession.findFirst({
    where: { status: "CLOSED" },
    orderBy: { updatedAt: "desc" },
  });

  if (!session) {
    return NextResponse.json({ available: false, message: "Results are not available yet." }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const [positions, voteCounts] = await Promise.all([
    prisma.position.findMany({
      where: { votingSessionId: session.id },
      orderBy: { displayOrder: "asc" },
      select: {
        name: true,
        candidates: {
          select: { id: true, name: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.vote.groupBy({
      by: ["candidateId"],
      where: { votingSessionId: session.id },
      _count: { _all: true },
    }),
  ]);

  const countsByCandidate = new Map(
    voteCounts.map((item) => [item.candidateId, item._count._all]),
  );

  return NextResponse.json({
    available: true,
    status: session.status === "OPEN" ? "LIVE" : "FINAL",
    sessionName: session.name,
    updatedAt: now.toISOString(),
    positions: positions.map((position) => ({
      name: position.name,
      candidates: position.candidates
        .map((candidate) => ({
          name: candidate.name,
          votes: countsByCandidate.get(candidate.id) ?? 0,
        }))
        .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name)),
    })),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
