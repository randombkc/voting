"use server";

import { Prisma, PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { sendVerificationOtpEmail } from "@/lib/email/gmail";
import { createVoterSession, verifyVoterSession } from "@/lib/session";

const prisma = new PrismaClient();

async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown-ip";
}

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

async function getCurrentOpenVotingSession() {
  const now = new Date();
  const openSessions = await prisma.votingSession.findMany({
    where: { status: "OPEN" },
    include: {
      positions: {
        orderBy: { displayOrder: "asc" },
        include: {
          candidates: {
            where: { status: "ACTIVE" },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  return openSessions.find((session) => {
    if (session.startTime && session.startTime > now) return false;
    if (session.endTime && session.endTime < now) return false;
    return true;
  }) ?? null;
}

export async function requestOtp(data: { name: string; email: string }) {
  if (!data.name || !data.email) {
    return { success: false, error: "Name and email are required." };
  }

  const email = data.email.toLowerCase().trim();
  const ip = await getClientIp();

  const activeSession = await getCurrentOpenVotingSession();

  if (!activeSession) {
    return { success: false, error: "Voting is currently closed." };
  }

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const emailRequests = await prisma.otpToken.count({
    where: {
      email,
      createdAt: { gte: tenMinutesAgo },
      purpose: "VOTER_VERIFICATION",
    },
  });

  if (emailRequests >= 3) {
    return { success: false, error: "Too many requests. Please try again in 10 minutes." };
  }

  const ipRequests = await prisma.otpToken.count({
    where: {
      ip,
      createdAt: { gte: tenMinutesAgo },
      purpose: "VOTER_VERIFICATION",
    },
  });

  if (ipRequests >= 10) {
    return { success: false, error: "Rate limit exceeded. Please try again later." };
  }

  await prisma.otpToken.updateMany({
    where: {
      email,
      used: false,
      expiresAt: { gt: new Date() },
      purpose: "VOTER_VERIFICATION",
    },
    data: { used: true },
  });

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpToken.create({
    data: {
      email,
      otpHash,
      ip,
      purpose: "VOTER_VERIFICATION",
      expiresAt,
    },
  });

  const res = await sendVerificationOtpEmail(email, otp);
  if (!res.success) {
    return { success: false, error: "Failed to send verification email. Please try again." };
  }

  await prisma.voter.upsert({
    where: { email },
    update: { name: data.name },
    create: { email, name: data.name, verified: false, eligible: true },
  });

  return { success: true };
}

export async function verifyOtp(data: { email: string; otp: string }) {
  const email = data.email.toLowerCase().trim();
  const otp = data.otp.trim();

  if (!email || !otp) {
    return { success: false, error: "Email and OTP are required." };
  }

  const activeSession = await getCurrentOpenVotingSession();
  if (!activeSession) {
    return { success: false, error: "Voting is currently closed." };
  }

  const tokenRecord = await prisma.otpToken.findFirst({
    where: {
      email,
      purpose: "VOTER_VERIFICATION",
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!tokenRecord) {
    return { success: false, error: "Invalid or expired OTP." };
  }

  if (tokenRecord.attempts >= 5) {
    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });
    return { success: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  const providedHash = hashOtp(otp);

  if (providedHash !== tokenRecord.otpHash) {
    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Incorrect OTP." };
  }

  await prisma.otpToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  const voter = await prisma.voter.update({
    where: { email },
    data: { verified: true },
  });

  if (!voter.eligible) {
    return { success: false, error: "You are not eligible to vote." };
  }

  await prisma.voterParticipation.upsert({
    where: {
      voterId_votingSessionId: {
        voterId: voter.id,
        votingSessionId: activeSession.id,
      },
    },
    update: { verified: true },
    create: {
      voterId: voter.id,
      votingSessionId: activeSession.id,
      verified: true,
      eligible: true,
      hasVoted: false,
    },
  });

  await createVoterSession(voter.id, activeSession.id);

  return { success: true };
}

export async function getCurrentBallot() {
  const voterSession = await verifyVoterSession();

  if (!voterSession) {
    return { success: false, error: "Your voting session is invalid or expired." };
  }

  const activeSession = await getCurrentOpenVotingSession();
  if (!activeSession || activeSession.id !== voterSession.votingSessionId) {
    return { success: false, error: "Voting is currently closed." };
  }

  const participation = await prisma.voterParticipation.findUnique({
    where: {
      voterId_votingSessionId: {
        voterId: voterSession.voter.id,
        votingSessionId: activeSession.id,
      },
    },
    select: {
      eligible: true,
      verified: true,
      hasVoted: true,
    },
  });

  if (!participation || !participation.eligible || !participation.verified) {
    return { success: false, error: "You are not eligible to vote in this session." };
  }

  return {
    success: true,
    session: {
      id: activeSession.id,
      name: activeSession.name,
      group: activeSession.group,
      positions: activeSession.positions.map((position) => ({
        id: position.id,
        name: position.name,
        minSelections: position.minSelections,
        maxSelections: position.maxSelections,
        isMandatory: position.isMandatory,
        candidates: position.candidates.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
        })),
      })),
    },
  };
}

export async function submitVote(data: { selections: Record<string, string[] | string> }) {
  const voterSession = await verifyVoterSession();
  if (!voterSession) {
    return { success: false, error: "Your voting session is invalid or expired." };
  }

  const normalizedSelections: Record<string, string[]> = {};
  const rawSelections = data?.selections ?? {};

  for (const [positionId, value] of Object.entries(rawSelections)) {
    const candidateIds = Array.isArray(value)
      ? value
      : value
        ? [value]
        : [];

    normalizedSelections[positionId] = candidateIds
      .map((candidateId) => String(candidateId).trim())
      .filter(Boolean);
  }

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "VotingSession" WHERE id = ${voterSession.votingSessionId} FOR UPDATE`;

      const participation = await tx.voterParticipation.findUnique({
        where: {
          voterId_votingSessionId: {
            voterId: voterSession.voter.id,
            votingSessionId: voterSession.votingSessionId,
          },
        },
      });

      if (!participation) {
        return { ok: false, error: "You are not eligible to vote in this session." } as const;
      }

      if (!participation.eligible || !participation.verified) {
        return { ok: false, error: "You are not eligible to vote in this session." } as const;
      }

      if (participation.hasVoted) {
        return { ok: false, error: "Your vote has already been submitted." } as const;
      }

      const session = await tx.votingSession.findUnique({
        where: { id: voterSession.votingSessionId },
        include: {
          positions: {
            orderBy: { displayOrder: "asc" },
            include: {
              candidates: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      });

      if (!session) {
        return { ok: false, error: "Voting is currently closed." } as const;
      }

      if (session.status !== "OPEN") {
        return { ok: false, error: "Voting is currently closed." } as const;
      }

      const now = new Date();
      if (session.startTime && session.startTime > now) {
        return { ok: false, error: "Voting has not started yet." } as const;
      }

      if (session.endTime && session.endTime < now) {
        return { ok: false, error: "Voting is currently closed." } as const;
      }

      const positionMap = new Map(session.positions.map((position) => [position.id, position]));
      const allPositionIds = new Set(session.positions.map((position) => position.id));
      const allSelectedCandidates = new Set<string>();

      for (const [positionId, candidateIds] of Object.entries(normalizedSelections)) {
        const position = positionMap.get(positionId);
        if (!position) {
          return { ok: false, error: "Unknown position submitted." } as const;
        }

        if (candidateIds.length < 0) {
          return { ok: false, error: "Invalid selection submitted." } as const;
        }

        if (candidateIds.length !== new Set(candidateIds).size) {
          return { ok: false, error: "Duplicate candidate selections are not allowed." } as const;
        }

        if (candidateIds.length < position.minSelections || candidateIds.length > position.maxSelections) {
          return { ok: false, error: `Invalid selection count for ${position.name}.` } as const;
        }

        const validCandidateIds = new Set(position.candidates.map((candidate) => candidate.id));

        for (const candidateId of candidateIds) {
          if (!validCandidateIds.has(candidateId)) {
            return { ok: false, error: `Invalid candidate selected for ${position.name}.` } as const;
          }

          if (allSelectedCandidates.has(candidateId)) {
            return { ok: false, error: "Duplicate candidate selections are not allowed." } as const;
          }

          allSelectedCandidates.add(candidateId);
        }
      }

      for (const position of session.positions) {
        const selectedIds = normalizedSelections[position.id] ?? [];
        const isRequiredPosition = position.isMandatory || position.minSelections > 0;

        if (isRequiredPosition && selectedIds.length < position.minSelections) {
          return { ok: false, error: `Please select enough candidates for ${position.name}.` } as const;
        }

        if (selectedIds.length > position.maxSelections) {
          return { ok: false, error: `Too many candidates selected for ${position.name}.` } as const;
        }
      }

      const unexpectedPositionIds = Object.keys(normalizedSelections).filter((positionId) => !allPositionIds.has(positionId));
      if (unexpectedPositionIds.length > 0) {
        return { ok: false, error: "Unknown position submitted." } as const;
      }

      const voteRows = [] as Array<{
        votingSessionId: string;
        positionId: string;
        candidateId: string;
        voterParticipationId: string;
      }>;

      for (const position of session.positions) {
        const selectedIds = normalizedSelections[position.id] ?? [];
        for (const candidateId of selectedIds) {
          voteRows.push({
            votingSessionId: session.id,
            positionId: position.id,
            candidateId,
            voterParticipationId: participation.id,
          });
        }
      }

      await tx.vote.createMany({
        data: voteRows,
      });

      await tx.voterParticipation.update({
        where: { id: participation.id },
        data: {
          hasVoted: true,
          votedAt: new Date(),
        },
      });

      return { ok: true } as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePath("/vote");
  return { success: true, message: "Your vote has been submitted successfully." };
}
