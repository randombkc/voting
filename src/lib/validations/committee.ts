import { z } from "zod";

const baseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phoneNumber: z.string().min(5, "Phone number is required"),
  feedback: z.string().min(1, "Feedback is required").max(2000),
});

const periziaSchema = z.object({
  selectedGroup: z.literal("PERIZIA"),
  wantsOfficialCommittee: z.preprocess(
    (val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    },
    z.boolean()
  ),
  positionPreferenceText: z.string().optional(),
  contributionPreference: z.string().optional(),
  otherContributionText: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.wantsOfficialCommittee) {
    if (!data.positionPreferenceText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a position preference",
        path: ["positionPreferenceText"],
      });
    }
    const validPositions = ["General Secretary", "Treasurer", "Executive"];
    if (data.positionPreferenceText && !validPositions.includes(data.positionPreferenceText)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid position preference",
        path: ["positionPreferenceText"],
      });
    }
  } else {
    if (!data.contributionPreference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select how you would like to contribute",
        path: ["contributionPreference"],
      });
    }
    const validContributions = ["Emotional support", "IT/creative", "Other"];
    if (data.contributionPreference && !validContributions.includes(data.contributionPreference)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid contribution preference",
        path: ["contributionPreference"],
      });
    }
    if (data.contributionPreference === "Other" && (!data.otherContributionText || data.otherContributionText.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your contribution",
        path: ["otherContributionText"],
      });
    }
    if (data.contributionPreference !== "Other" && data.otherContributionText) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Other contribution text is not required for this selection",
        path: ["otherContributionText"],
      });
    }
  }
});

const cruxSchema = z.object({
  selectedGroup: z.literal("CRUX"),
  wantsOfficialCommittee: z.preprocess(
    (val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    },
    z.boolean()
  ),
  positionPreferenceText: z.string().optional(),
  contributionPreference: z.string().optional(),
  otherContributionText: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.wantsOfficialCommittee) {
    if (!data.positionPreferenceText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a position preference",
        path: ["positionPreferenceText"],
      });
    }
    const validPositions = ["Vice President", "Secretary", "Joint Secretary", "Treasurer", "Convenor", "Co-Convenor"];
    if (data.positionPreferenceText && !validPositions.includes(data.positionPreferenceText)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid position preference",
        path: ["positionPreferenceText"],
      });
    }
  } else {
    if (!data.contributionPreference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select how you would like to contribute",
        path: ["contributionPreference"],
      });
    }
    const validContributions = ["Emotional support", "IT/creative", "Other"];
    if (data.contributionPreference && !validContributions.includes(data.contributionPreference)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid contribution preference",
        path: ["contributionPreference"],
      });
    }
    if (data.contributionPreference === "Other" && (!data.otherContributionText || data.otherContributionText.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your contribution",
        path: ["otherContributionText"],
      });
    }
    if (data.contributionPreference !== "Other" && data.otherContributionText) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Other contribution text is not required for this selection",
        path: ["otherContributionText"],
      });
    }
  }
});

const naSchema = z.object({
  selectedGroup: z.literal("NA"),
});

// The top level schema handles branching logic securely.
export const committeeApplicationSchema = z.discriminatedUnion("selectedGroup", [
  baseSchema.merge(periziaSchema),
  baseSchema.merge(cruxSchema),
  baseSchema.merge(naSchema),
]);

export type CommitteeApplicationFormData = z.infer<typeof committeeApplicationSchema>;
