"use server";

import { PrismaClient, Group } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/utils/phone";

const prisma = new PrismaClient();

// Optional: you can extract admin user ID if available, for AuditLog
const ADMIN_ACTOR_ID = "admin-session";

export async function getApplications(filter: string = "Pending") {
  const whereClause: Prisma.CommitteeApplicationWhereInput = {};

  if (filter === "Pending") whereClause.status = "PENDING";
  if (filter === "Approved") whereClause.status = "APPROVED";
  if (filter === "Rejected") whereClause.status = "REJECTED";
  if (filter === "Perizia") whereClause.selectedGroup = "PERIZIA";
  if (filter === "Crux") whereClause.selectedGroup = "CRUX";

  return await prisma.committeeApplication.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplication(id: string) {
  return await prisma.committeeApplication.findUnique({
    where: { id },
  });
}

export async function getVotingSessionsByGroup(group: Group) {
  return await prisma.votingSession.findMany({
    where: {
      group,
      status: { in: ["DRAFT", "OPEN"] },
    },
    include: {
      positions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function rejectApplication(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const app = await tx.committeeApplication.findUnique({ where: { id } });
      if (!app) throw new Error("Application not found.");
      if (app.status !== "PENDING") throw new Error("Only pending applications can be rejected.");

      await tx.committeeApplication.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      await tx.auditLog.create({
        data: {
          action: "COMMITTEE_APPLICATION_REJECTED",
          actorId: ADMIN_ACTOR_ID,
          targetType: "CommitteeApplication",
          targetId: id,
          metadata: { name: app.name, phone: app.phoneNumber },
        },
      });
    });

    revalidatePath("/admin/committee");
    return { success: true };
  } catch (error: unknown) {
    console.error("Reject application error:", error);
    return { success: false, error: (error as Error).message || "Failed to reject application." };
  }
}

export async function approveApplication(id: string, votingSessionId?: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const app = await tx.committeeApplication.findUnique({ where: { id } });
      
      if (!app) throw new Error("Application not found.");
      if (app.status !== "PENDING") throw new Error("Only pending applications can be approved.");

      // Case A: YES + Position -> Needs candidate creation
      if (app.wantsOfficialCommittee === true) {
        if (!votingSessionId) {
          throw new Error("Voting Session must be selected for official committee candidates.");
        }
        
        if (!app.selectedGroup) {
          throw new Error("Application group is missing but wants official committee.");
        }

        if (!app.positionPreferenceText) {
          throw new Error("Position preference is missing in the application.");
        }

        // Validate voting session
        const session = await tx.votingSession.findUnique({
          where: { id: votingSessionId },
          include: { positions: true }
        });

        if (!session) throw new Error("Selected Voting Session not found.");
        if (session.group !== app.selectedGroup) {
          throw new Error("Selected Voting Session does not match the application's group.");
        }

        // Validate position inside session
        const position = session.positions.find(p => p.name === app.positionPreferenceText);
        if (!position) {
          throw new Error(`Position '${app.positionPreferenceText}' not found in the selected Voting Session.`);
        }

        // Check duplicates
        const normalizedPhone = normalizePhoneNumber(app.phoneNumber);
        if (normalizedPhone) {
          const existingCandidate = await tx.candidate.findUnique({
            where: { phoneNumber: normalizedPhone },
          });
          if (existingCandidate) {
            throw new Error("A candidate with this phone number already exists.");
          }
        }

        // Create Candidate
        const candidate = await tx.candidate.create({
          data: {
            name: app.name,
            phoneNumber: normalizedPhone || app.phoneNumber,
            positionId: position.id,
            status: "ACTIVE",
          },
        });

        // Audit Candidate Creation
        await tx.auditLog.create({
          data: {
            action: "CANDIDATE_AUTO_CREATED",
            actorId: ADMIN_ACTOR_ID,
            targetType: "Candidate",
            targetId: candidate.id,
            metadata: { applicationId: app.id, positionId: position.id, sessionId: session.id },
          },
        });
      }

      // Update Application status
      await tx.committeeApplication.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      // Audit Application Approval
      await tx.auditLog.create({
        data: {
          action: "COMMITTEE_APPLICATION_APPROVED",
          actorId: ADMIN_ACTOR_ID,
          targetType: "CommitteeApplication",
          targetId: id,
          metadata: { name: app.name, wantsOfficialCommittee: app.wantsOfficialCommittee },
        },
      });
    });

    revalidatePath("/admin/committee");
    return { success: true };
  } catch (error: unknown) {
    console.error("Approve application error:", error);
    return { success: false, error: (error as Error).message || "Failed to approve application." };
  }
}
