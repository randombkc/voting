"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCandidate, getSessionsByGroup, getPositionsBySession } from "@/app/admin/candidates/actions";

export default function CandidateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  const handleGroupChange = async (group: string) => {
    setSelectedGroup(group);
    setSelectedSession("");
    setSelectedPosition("");
    setPositions([]);

    if (!group) {
      setSessions([]);
      return;
    }

    setIsLoadingSessions(true);
    try {
      const res = await getSessionsByGroup(group as "PERIZIA" | "CRUX" | "BOTH");
      setSessions(res);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSessionChange = async (sessionId: string) => {
    setSelectedSession(sessionId);
    setSelectedPosition("");

    if (!sessionId) {
      setPositions([]);
      return;
    }

    setIsLoadingPositions(true);
    try {
      const res = await getPositionsBySession(sessionId);
      setPositions(res);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (!selectedGroup || !selectedSession || !selectedPosition || !name || !phoneNumber) {
      setError("All fields are required.");
      return;
    }

    startTransition(async () => {
      const res = await createCandidate({
        name,
        phoneNumber,
        positionId: selectedPosition,
        sessionId: selectedSession,
        group: selectedGroup as "PERIZIA" | "CRUX" | "BOTH",
      });

      if (res.success) {
        router.push("/admin/candidates");
      } else {
        setError(res.error || "Failed to create candidate");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">1. Group *</label>
        <select
          required
          value={selectedGroup}
          onChange={(e) => handleGroupChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
        >
          <option value="">-- Select a Group --</option>
          <option value="PERIZIA">Perizia</option>
          <option value="CRUX">Crux</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">2. Voting Session *</label>
        <select
          required
          disabled={!selectedGroup || isLoadingSessions}
          value={selectedSession}
          onChange={(e) => handleSessionChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border disabled:bg-gray-100"
        >
          <option value="">{isLoadingSessions ? "Loading..." : "-- Select a Voting Session --"}</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">3. Position *</label>
        <select
          required
          disabled={!selectedSession || isLoadingPositions}
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border disabled:bg-gray-100"
        >
          <option value="">{isLoadingPositions ? "Loading..." : "-- Select a Position --"}</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700">Candidate Name *</label>
        <input
          type="text"
          name="name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Candidate Phone Number *</label>
        <input
          type="tel"
          name="phoneNumber"
          required
          placeholder="+1234567890"
          className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Will be normalized automatically before saving.</p>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending || !selectedPosition}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Candidate"}
        </button>
      </div>
    </form>
  );
}
