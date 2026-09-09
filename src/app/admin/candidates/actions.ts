"use server";

import { PrismaClient, CandidateStatus, Group } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/session";
import { normalizePhoneNumber } from "@/lib/utils/phone";

const prisma = new PrismaClient();

export async function createCandidate(data: {
  name: string;
  phoneNumber: string;
  positionId: string;
  sessionId: string;
  group: string;
}) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");

  try {
    // 1. Re-validate relationships
    const session = await prisma.votingSession.findUnique({ where: { id: data.sessionId } });
    if (!session) throw new Error("Voting Session not found");
    if (session.group !== data.group) throw new Error("Voting Session does not belong to the selected group");

    const position = await prisma.position.findUnique({ where: { id: data.positionId } });
    if (!position) throw new Error("Position not found");
    if (position.votingSessionId !== data.sessionId) throw new Error("Position does not belong to the selected Voting Session");

    // 2. Normalize phone number
    const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

    // 3. Create candidate
    await prisma.candidate.create({
      data: {
        name: data.name,
        phoneNumber: normalizedPhone,
        positionId: data.positionId,
        status: "ACTIVE", // Manual creations are active by default
      }
    });

    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { success: false, error: "A candidate with this phone number already exists." };
    }
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCandidate(id: string, data: {
  name: string;
  phoneNumber: string;
  status: CandidateStatus;
}) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new Error("Candidate not found");

    const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

    await prisma.candidate.update({
      where: { id },
      data: {
        name: data.name,
        phoneNumber: normalizedPhone,
        status: data.status,
      }
    });

    revalidatePath(`/admin/candidates/${id}`);
    revalidatePath("/admin/candidates");
    // Also revalidate the session detail page just in case
    revalidatePath(`/admin/voting/${candidate.positionId}`); 
    return { success: true };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { success: false, error: "Another candidate with this phone number already exists." };
    }
    return { success: false, error: (error as Error).message };
  }
}

// Used to fetch dependent dropdowns in the creation form
export async function getSessionsByGroup(group: Group) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");
  return await prisma.votingSession.findMany({
    where: { group },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true }
  });
}

export async function getPositionsBySession(sessionId: string) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");
  return await prisma.position.findMany({
    where: { votingSessionId: sessionId },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true }
  });
}
