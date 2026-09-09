"use server";

import { PrismaClient } from "@prisma/client";
import { committeeApplicationSchema, CommitteeApplicationFormData } from "@/lib/validations/committee";
import { normalizePhoneNumber } from "@/lib/utils/phone";

const prisma = new PrismaClient();

export async function submitApplication(data: CommitteeApplicationFormData) {
  try {
    // 1. Validate payload against Zod schema on the server
    const parsedData = committeeApplicationSchema.parse(data);

    // 2. Normalize phone number
    const normalizedPhone = normalizePhoneNumber(parsedData.phoneNumber);

    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number." };
    }

    // 3. Transactional Duplicate Check & Insertion
    // We run the checks inside a transaction to prevent race conditions.
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing Candidate
      const existingCandidate = await tx.candidate.findUnique({
        where: { phoneNumber: normalizedPhone },
      });

      if (existingCandidate) {
        return { duplicate: true };
      }

      // Check for existing CommitteeApplication
      const existingApplication = await tx.committeeApplication.findUnique({
        where: { phoneNumber: normalizedPhone },
      });

      if (existingApplication) {
        return { duplicate: true };
      }

      // Proceed to create if no duplicates found
      const newApplication = await tx.committeeApplication.create({
        data: {
          name: parsedData.name,
          phoneNumber: normalizedPhone,
          selectedGroup: parsedData.selectedGroup === "NA" ? null : parsedData.selectedGroup,
          wantsOfficialCommittee: "wantsOfficialCommittee" in parsedData ? parsedData.wantsOfficialCommittee : false,
          positionPreferenceText: "positionPreferenceText" in parsedData ? parsedData.positionPreferenceText : null,
          contributionPreference: "contributionPreference" in parsedData ? parsedData.contributionPreference : null,
          otherContributionText: "otherContributionText" in parsedData ? parsedData.otherContributionText : null,
          feedback: parsedData.feedback,
          status: "PENDING",
        },
      });

      return { success: true, application: newApplication };
    });

    if (result.duplicate) {
      return { success: false, error: "An application has already been submitted with these details." };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Application submission error:", error);

    // Gracefully handle Prisma unique constraint violations (P2002)
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
       return { success: false, error: "An application has already been submitted with these details." };
    }

    if (typeof error === "object" && error !== null && "name" in error && error.name === "ZodError") {
      return { success: false, error: "Invalid form data submitted." };
    }

    return { success: false, error: "Something went wrong while submitting your application. Please try again." };
  }
}
