"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { committeeApplicationSchema, type CommitteeApplicationFormData } from "@/lib/validations/committee";
import { submitApplication } from "@/app/committee/actions";

export default function CommitteeForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(committeeApplicationSchema),
    mode: "onTouched",
  });

  const fieldErrors = errors as Record<string, { message?: string } | undefined>;
  const selectedGroup = useWatch({ control, name: "selectedGroup" });
  const wantsOfficialCommittee = useWatch({ control, name: "wantsOfficialCommittee" });
  const contributionPreference = useWatch({ control, name: "contributionPreference" });
  const wantsOfficialCommitteeValue = wantsOfficialCommittee === true || (typeof wantsOfficialCommittee === "string" && wantsOfficialCommittee === "true");

  const handleNextStep = async () => {
    let valid = false;

    if (step === 1) {
      valid = await trigger(["name", "phoneNumber", "selectedGroup"]);
    } else if (step === 2 || step === 3) {
      valid = await trigger([
        "wantsOfficialCommittee",
        "positionPreferenceText",
        "contributionPreference",
        "otherContributionText",
      ]);
    }

    if (valid) {
      if (step === 1) {
        if (selectedGroup === "PERIZIA") setStep(2);
        else if (selectedGroup === "CRUX") setStep(3);
        else if (selectedGroup === "NA") setStep(4);
      } else if (step === 2 || step === 3) {
        setStep(4);
      }
    }
  };

  const handleBack = () => {
    if (step === 4) {
      if (selectedGroup === "PERIZIA") setStep(2);
      else if (selectedGroup === "CRUX") setStep(3);
      else if (selectedGroup === "NA") setStep(1);
    } else if (step === 2 || step === 3) {
      setStep(1);
    }
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await submitApplication(data as CommitteeApplicationFormData);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setServerError(response.error || "An unknown error occurred.");
      }
    } catch {
      setServerError("Something went wrong while submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Thank you for submitting the form.</h2>
        <p className="text-gray-700">Your response has been recorded successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Committee Application</h1>

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Section 1 — Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 text-gray-900 bg-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="John Doe"
              />
              {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number <span className="text-red-500">*</span></label>
              <input
                {...register("phoneNumber")}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 text-gray-900 bg-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="+91 9876543210"
              />
              {fieldErrors.phoneNumber && <p className="text-red-500 text-sm mt-1">{fieldErrors.phoneNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crux and Perizia are the same family, but if you had to choose one, which would you prefer? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {["PERIZIA", "CRUX", "NA"].map((val) => (
                  <label key={val} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value={val}
                      {...register("selectedGroup")}
                      className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-gray-700">{val === "PERIZIA" ? "Perizia" : val === "CRUX" ? "Crux" : "NA"}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.selectedGroup && <p className="text-red-500 text-sm mt-1">{fieldErrors.selectedGroup.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Section 2 — Perizia</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you like to be a part of the official Committee (of 14 members)? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" value="true" {...register("wantsOfficialCommittee")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" value="false" {...register("wantsOfficialCommittee")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
              {fieldErrors.wantsOfficialCommittee && <p className="text-red-500 text-sm mt-1">{fieldErrors.wantsOfficialCommittee.message}</p>}
            </div>

            {wantsOfficialCommitteeValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Which position would you prefer? <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {["General Secretary", "Treasurer", "Executive"].map((pos) => (
                    <label key={pos} className="flex items-center space-x-3 cursor-pointer">
                      <input type="radio" value={pos} {...register("positionPreferenceText")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                      <span className="text-gray-700">{pos}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.positionPreferenceText && <p className="text-red-500 text-sm mt-1">{fieldErrors.positionPreferenceText.message}</p>}
              </div>
            )}

            {!wantsOfficialCommitteeValue && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you like to contribute? <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    {["Emotional support", "IT/creative", "Other"].map((con) => (
                      <label key={con} className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" value={con} {...register("contributionPreference")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-gray-700">{con}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.contributionPreference && <p className="text-red-500 text-sm mt-1">{fieldErrors.contributionPreference.message}</p>}
                </div>

                {contributionPreference === "Other" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Please specify <span className="text-red-500">*</span></label>
                    <input {...register("otherContributionText")} type="text" className="w-full px-4 py-2 border border-gray-300 text-gray-900 bg-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                    {fieldErrors.otherContributionText && <p className="text-red-500 text-sm mt-1">{fieldErrors.otherContributionText.message}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Section 3 — Crux</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you like to be a part of the official Committee (of 16 members)? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" value="true" {...register("wantsOfficialCommittee")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" value="false" {...register("wantsOfficialCommittee")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
              {fieldErrors.wantsOfficialCommittee && <p className="text-red-500 text-sm mt-1">{fieldErrors.wantsOfficialCommittee.message}</p>}
            </div>

            {wantsOfficialCommitteeValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Which position would you prefer? <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {["Vice President", "Secretary", "Joint Secretary", "Treasurer", "Convenor", "Co-Convenor"].map((pos) => (
                    <label key={pos} className="flex items-center space-x-3 cursor-pointer">
                      <input type="radio" value={pos} {...register("positionPreferenceText")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                      <span className="text-gray-700">{pos}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.positionPreferenceText && <p className="text-red-500 text-sm mt-1">{fieldErrors.positionPreferenceText.message}</p>}
              </div>
            )}

            {!wantsOfficialCommitteeValue && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you like to contribute? <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    {["Emotional support", "IT/creative", "Other"].map((con) => (
                      <label key={con} className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" value={con} {...register("contributionPreference")} className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4" />
                        <span className="text-gray-700">{con}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.contributionPreference && <p className="text-red-500 text-sm mt-1">{fieldErrors.contributionPreference.message}</p>}
                </div>

                {contributionPreference === "Other" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Please specify <span className="text-red-500">*</span></label>
                    <input {...register("otherContributionText")} type="text" className="w-full px-4 py-2 border border-gray-300 text-gray-900 bg-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                    {fieldErrors.otherContributionText && <p className="text-red-500 text-sm mt-1">{fieldErrors.otherContributionText.message}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Section 4 — Miscellaneous / Feedback</h2>

            {selectedGroup === "NA" && (
              <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md mb-4 border border-blue-200">
                P.S. If you have come directly from Section 1, it is because you chose NA in Section 1.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">According to you, how can we make CRUX-PERIZIA great again <span className="text-red-500">*</span></label>
              <textarea {...register("feedback")} rows={4} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
              {fieldErrors.feedback && <p className="text-red-500 text-sm mt-1">{fieldErrors.feedback.message}</p>}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
