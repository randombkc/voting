"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCandidate } from "@/app/admin/candidates/actions";
import { CandidateStatus } from "@prisma/client";

type CandidateEditProps = {
  id: string;
  name: string;
  phoneNumber: string | null;
  status: CandidateStatus;
};

export default function CandidateEditForm({ candidate }: { candidate: CandidateEditProps }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const status = formData.get("status") as CandidateStatus;

    if (!name || !phoneNumber || !status) {
      setError("All fields are required.");
      return;
    }

    startTransition(async () => {
      const res = await updateCandidate(candidate.id, {
        name,
        phoneNumber,
        status,
      });

      if (res.success) {
        router.push("/admin/candidates");
      } else {
        setError(res.error || "Failed to update candidate");
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
        <label className="block text-sm font-medium text-gray-700">Candidate Name *</label>
        <input
          type="text"
          name="name"
          defaultValue={candidate.name}
          required
          className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
        <input
          type="tel"
          name="phoneNumber"
          defaultValue={candidate.phoneNumber || ""}
          required
          className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Will be normalized automatically before saving.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status *</label>
        <select
          name="status"
          defaultValue={candidate.status}
          required
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">Only ACTIVE candidates will be visible during the voting session.</p>
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push("/admin/candidates")}
          disabled={isPending}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
