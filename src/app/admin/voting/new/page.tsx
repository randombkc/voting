"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createVotingSession } from "../actions";
import { Group } from "@prisma/client";

export default function NewVotingSessionPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const group = formData.get("group") as Group;
    const startTimeStr = formData.get("startTime") as string;
    const endTimeStr = formData.get("endTime") as string;

    const startTime = startTimeStr ? new Date(startTimeStr) : undefined;
    const endTime = endTimeStr ? new Date(endTimeStr) : undefined;

    if (!name || !group) {
      setError("Name and Group are required.");
      return;
    }

    startTransition(async () => {
      const res = await createVotingSession({ name, group, startTime, endTime });
      if (res.success && res.session) {
        router.push(`/admin/voting/${res.session.id}`);
      } else {
        setError(res.error || "Failed to create voting session.");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/voting" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Voting Sessions
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create Voting Session</h3>
          <p className="mt-1 text-sm text-gray-500">
            A new voting session will be created in DRAFT status. You can add positions to it afterwards.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Session Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              placeholder="e.g. Annual Executive Election 2026"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700">
              Target Group <span className="text-red-500">*</span>
            </label>
            <select
              id="group"
              name="group"
              required
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
            >
              <option value="">-- Select a Group --</option>
              <option value="PERIZIA">Perizia</option>
              <option value="CRUX">Crux</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                name="startTime"
                id="startTime"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                End Time (Optional)
              </label>
              <input
                type="datetime-local"
                name="endTime"
                id="endTime"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Voting Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
