"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getCurrentBallot, requestOtp, submitVote, verifyOtp } from "./actions";

type BallotPosition = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isMandatory: boolean;
  candidates: { id: string; name: string }[];
};

type BallotSession = {
  id: string;
  name: string;
  group: string;
  positions: BallotPosition[];
};

export default function VotePage() {
  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "BALLOT" | "SUBMITTED">("REQUEST");
  const [email, setEmail] = useState("");
  const [ballot, setBallot] = useState<BallotSession | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadBallot = async () => {
    const res = await getCurrentBallot();
    if (res.success && res.session) {
      setBallot(res.session);
      setStep("BALLOT");
      return;
    }

    if (res.error === "Your voting session is invalid or expired.") {
      setStep("REQUEST");
      setError(null);
      return;
    }

    setBallot(null);
    setStep("REQUEST");
    setError(res.error || "Voting is currently closed.");
  };

  const handleRequestOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const emailInput = formData.get("email") as string;

    startTransition(async () => {
      const res = await requestOtp({ name, email: emailInput });
      if (res.success) {
        setEmail(emailInput);
        setStep("VERIFY");
      } else {
        setError(res.error || "Failed to request OTP.");
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const otp = formData.get("otp") as string;

    startTransition(async () => {
      const res = await verifyOtp({ email, otp });
      if (res.success) {
        await loadBallot();
      } else {
        setError(res.error || "Failed to verify OTP.");
      }
    });
  };

  const toggleCandidate = (positionId: string, candidateId: string, maxSelections: number) => {
    setSelections((current) => {
      const currentSelection = current[positionId] ?? [];
      const exists = currentSelection.includes(candidateId);

      if (maxSelections === 1) {
        return { ...current, [positionId]: exists ? [] : [candidateId] };
      }

      if (exists) {
        return {
          ...current,
          [positionId]: currentSelection.filter((id) => id !== candidateId),
        };
      }

      if (currentSelection.length >= maxSelections) {
        return current;
      }

      return {
        ...current,
        [positionId]: [...currentSelection, candidateId],
      };
    });
  };

  const handleSubmitVote = () => {
    startTransition(async () => {
      const res = await submitVote({ selections });
      if (res.success) {
        setStep("SUBMITTED");
        setError(null);
        return;
      }

      setError(res.error || "Your vote could not be submitted.");
    });
  };

  if (step === "SUBMITTED") {
    return (
      <div className="page-shell min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="public-card">
            <Link href="/" className="back-link">← Home</Link>
            <h2 className="display-heading display-heading-small mt-8">Vote Submitted</h2>
            <p className="mt-4 text-sm text-gray-600">
              Your vote has been submitted successfully.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "BALLOT" && ballot) {
    return (
      <div className="page-shell min-h-screen py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 flex items-center justify-between border-b border-black pb-4">
            <Link href="/" className="wordmark">Batch 2023</Link>
            <Link href="/" className="back-link">Home</Link>
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{ballot.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{ballot.group} voting session</p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-6">
            {ballot.positions.map((position) => {
              const selected = selections[position.id] ?? [];
              const isMultiSelect = position.maxSelections > 1;

              return (
                <div key={position.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{position.name}</h2>
                      <p className="text-sm text-gray-600">
                        {position.isMandatory ? "Mandatory" : "Optional"} · Min {position.minSelections} · Max {position.maxSelections}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {position.candidates.length === 0 ? (
                      <p className="text-sm text-gray-500">No active candidates available for this position.</p>
                    ) : (
                      position.candidates.map((candidate) => {
                        const checked = selected.includes(candidate.id);
                        const inputType = isMultiSelect ? "checkbox" : "radio";

                        return (
                          <label key={candidate.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                            <input
                              type={inputType}
                              name={position.id}
                              value={candidate.id}
                              checked={checked}
                              onChange={() => toggleCandidate(position.id, candidate.id, position.maxSelections)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-800">{candidate.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmitVote}
              className="rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Vote"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="wordmark">Batch 2023</Link>
          <Link href="/" className="back-link">Home</Link>
        </div>
        <h2 className="display-heading display-heading-small">Voting</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === "REQUEST"
            ? "Enter your details to verify your eligibility."
            : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="public-card">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {step === "REQUEST" ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input name="name" type="text" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input name="email" type="email" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isPending ? "Sending..." : "Request Verification Code"}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-sm font-medium text-gray-700">6-Digit Code</label>
                <div className="mt-1">
                  <input
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                    placeholder="------"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isPending ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("REQUEST");
                    setError(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
