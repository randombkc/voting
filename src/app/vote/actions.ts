"use server";

import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import crypto from "crypto";
import { sendVerificationOtpEmail } from "@/lib/email/resend";
import { createVoterSession } from "@/lib/session";

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

export async function requestOtp(data: { name: string; email: string }) {
  if (!data.name || !data.email) {
    return { success: false, error: "Name and email are required." };
  }
  
  const email = data.email.toLowerCase().trim();
  const ip = await getClientIp();

  // 1. Resolve active voting session
  const activeSession = await prisma.votingSession.findFirst({
    where: { status: "OPEN" }
  });

  if (!activeSession) {
    return { success: false, error: "Voting is currently closed." };
  }

  // 2. Check rate limits (3 per email per 10 mins OR 10 per IP per 10 mins)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const emailRequests = await prisma.otpToken.count({
    where: {
      email,
      createdAt: { gte: tenMinutesAgo },
      purpose: "VOTER_VERIFICATION"
    }
  });

  if (emailRequests >= 3) {
    return { success: false, error: "Too many requests. Please try again in 10 minutes." };
  }

  const ipRequests = await prisma.otpToken.count({
    where: {
      ip,
      createdAt: { gte: tenMinutesAgo },
      purpose: "VOTER_VERIFICATION"
    }
  });

  if (ipRequests >= 10) {
    return { success: false, error: "Rate limit exceeded. Please try again later." };
  }

  // 3. Invalidate previous unexpired OTPs
  await prisma.otpToken.updateMany({
    where: {
      email,
      used: false,
      expiresAt: { gt: new Date() },
      purpose: "VOTER_VERIFICATION"
    },
    data: { used: true } // Mark as used to invalidate
  });

  // 4. Generate and store new OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpToken.create({
    data: {
      email,
      otpHash,
      ip,
      purpose: "VOTER_VERIFICATION",
      expiresAt,
    }
  });

  // 5. Send Email
  const res = await sendVerificationOtpEmail(email, otp);
  if (!res.success) {
    return { success: false, error: "Failed to send verification email. Please try again." };
  }

  // Also store/update the Voter record
  await prisma.voter.upsert({
    where: { email },
    update: { name: data.name },
    create: { email, name: data.name, verified: false, eligible: true }
  });

  return { success: true };
}

export async function verifyOtp(data: { email: string; otp: string }) {
  const email = data.email.toLowerCase().trim();
  const otp = data.otp.trim();
  
  if (!email || !otp) {
    return { success: false, error: "Email and OTP are required." };
  }

  // Find active session again just to be safe
  const activeSession = await prisma.votingSession.findFirst({
    where: { status: "OPEN" }
  });

  if (!activeSession) {
    return { success: false, error: "Voting is currently closed." };
  }

  const tokenRecord = await prisma.otpToken.findFirst({
    where: {
      email,
      purpose: "VOTER_VERIFICATION",
      used: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!tokenRecord) {
    return { success: false, error: "Invalid or expired OTP." };
  }

  if (tokenRecord.attempts >= 5) {
    // Invalidate
    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { used: true }
    });
    return { success: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  const providedHash = hashOtp(otp);
  
  if (providedHash !== tokenRecord.otpHash) {
    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { attempts: { increment: 1 } }
    });
    return { success: false, error: "Incorrect OTP." };
  }

  // Success
  await prisma.otpToken.update({
    where: { id: tokenRecord.id },
    data: { used: true }
  });

  // Update voter verification status
  const voter = await prisma.voter.update({
    where: { email },
    data: { verified: true }
  });

  if (!voter.eligible) {
    return { success: false, error: "You are not eligible to vote." };
  }

  // Upsert VoterParticipation for this session
  await prisma.voterParticipation.upsert({
    where: {
      voterId_votingSessionId: {
        voterId: voter.id,
        votingSessionId: activeSession.id
      }
    },
    update: { verified: true },
    create: {
      voterId: voter.id,
      votingSessionId: activeSession.id,
      verified: true,
      eligible: true,
      hasVoted: false
    }
  });

  // Create Voter Session Token
  await createVoterSession(voter.id, activeSession.id);

  return { success: true };
}
