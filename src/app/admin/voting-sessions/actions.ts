"use server";

import { PrismaClient, Group, SessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/session";

const prisma = new PrismaClient();

export async function createVotingSession(data: { name: string; group: Group; startTime?: Date; endTime?: Date }) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");
  
  if (!data.name || !data.group) {
    throw new Error("Name and Group are required");
  }

  try {
    const session = await prisma.votingSession.create({
      data: {
        name: data.name,
        group: data.group,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        status: "DRAFT", // Enforced server-side
      }
    });

    revalidatePath("/admin/voting");
    return { success: true, session };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message || "Failed to create voting session" };
  }
}

export async function updateSessionStatus(id: string, newStatus: SessionStatus) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");

  try {
    const session = await prisma.votingSession.findUnique({
      where: { id },
      include: { positions: true }
    });

    if (!session) throw new Error("Voting Session not found");

    // Validate state transition
    if (session.status === "DRAFT" && newStatus === "OPEN") {
      if (session.positions.length === 0) {
        throw new Error("Cannot open a session that has no positions.");
      }
    } else if (session.status === "OPEN" && newStatus === "CLOSED") {
      // Allowed
    } else if (session.status === newStatus) {
      // No-op
    } else {
      throw new Error(`Invalid state transition from ${session.status} to ${newStatus}`);
    }

    await prisma.votingSession.update({
      where: { id },
      data: { status: newStatus }
    });

    revalidatePath(`/admin/voting/${id}`);
    revalidatePath("/admin/voting");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createPosition(data: { 
  name: string; 
  votingSessionId: string; 
  minSelections: number; 
  maxSelections: number; 
  isMandatory: boolean;
  displayOrder: number;
}) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");

  try {
    // Re-verify session
    const session = await prisma.votingSession.findUnique({ where: { id: data.votingSessionId } });
    if (!session) throw new Error("Voting Session not found");
    if (session.status !== "DRAFT") throw new Error("Positions can only be added while session is in DRAFT status");

    if (data.minSelections < 0) throw new Error("Minimum selections cannot be negative");
    if (data.maxSelections < data.minSelections) throw new Error("Maximum selections cannot be less than minimum selections");
    
    if (data.isMandatory && data.minSelections === 0) {
       throw new Error("Mandatory positions must require at least 1 selection.");
    }

    await prisma.position.create({
      data: {
        name: data.name,
        votingSessionId: data.votingSessionId,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections,
        isMandatory: data.isMandatory,
        displayOrder: data.displayOrder
      }
    });

    revalidatePath(`/admin/voting/${data.votingSessionId}`);
    return { success: true };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { success: false, error: "A position with this name already exists in this session." };
    }
    return { success: false, error: (error as Error).message };
  }
}

export async function deletePosition(id: string) {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");

  try {
    const position = await prisma.position.findUnique({
      where: { id },
      include: { candidates: true, votes: true }
    });

    if (!position) throw new Error("Position not found");

    if (position.candidates.length > 0) {
      throw new Error("Cannot delete position because it has candidates attached.");
    }
    
    if (position.votes.length > 0) {
      throw new Error("Cannot delete position because it has votes attached.");
    }

    await prisma.position.delete({
      where: { id }
    });

    revalidatePath(`/admin/voting/${position.votingSessionId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
