import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ---- Admin Sessions ----

export async function createAdminSession(adminId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.adminSession.create({
    data: {
      tokenHash,
      adminId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) return false;

  const tokenHash = hashToken(sessionToken);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true }
  });

  if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
    return false;
  }

  return true;
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) return null;

  const tokenHash = hashToken(sessionToken);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true }
  });

  if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
    return null;
  }

  return session.admin;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    try {
      await prisma.adminSession.delete({ where: { tokenHash } });
    } catch {}
  }

  cookieStore.delete("admin_session");
}

// ---- Voter Sessions ----

export async function createVoterSession(voterId: string, votingSessionId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  await prisma.voterSession.create({
    data: {
      tokenHash,
      voterId,
      votingSessionId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("voter_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function verifyVoterSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("voter_session")?.value;

  if (!sessionToken) return null;

  const tokenHash = hashToken(sessionToken);

  const session = await prisma.voterSession.findUnique({
    where: { tokenHash },
    include: {
      voter: true,
      votingSession: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  if (session.votingSession.status !== "OPEN") {
    return null;
  }

  const now = new Date();
  if (session.votingSession.startTime && session.votingSession.startTime > now) {
    return null;
  }

  if (session.votingSession.endTime && session.votingSession.endTime < now) {
    return null;
  }

  return session;
}

export async function clearVoterSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("voter_session")?.value;

  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    try {
      await prisma.voterSession.delete({ where: { tokenHash } });
    } catch {}
  }

  cookieStore.delete("voter_session");
}
