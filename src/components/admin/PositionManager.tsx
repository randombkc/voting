"use client";

import { useState, useTransition } from "react";
import { SessionStatus } from "@prisma/client";
import { createPosition, deletePosition } from "@/app/admin/voting/actions";

type PositionProps = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isMandatory: boolean;
  displayOrder: number;
  candidates: { id: string, name: string }[];
};

export default function PositionManager({
  sessionId,
  sessionStatus,
  positions
}: {
  sessionId: string;
  sessionStatus: SessionStatus;
  positions: PositionProps[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const minSelections = parseInt(formData.get("minSelections") as string, 10);
    const maxSelections = parseInt(formData.get("maxSelections") as string, 10);
    const isMandatory = formData.get("isMandatory") === "on";
    const displayOrder = parseInt(formData.get("displayOrder") as string, 10) || 0;

    startTransition(async () => {
      const res = await createPosition({
        name,
        votingSessionId: sessionId,
        minSelections,
        maxSelections,
        isMandatory,
        displayOrder
      });

      if (res.success) {
        setShowAddForm(false);
      } else {
        setError(res.error || "Failed to add position");
      }
    });
  };

  const handleDelete = (id: string, candidateCount: number) => {
    if (candidateCount > 0) {
      alert("Cannot delete position because it has candidates attached.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this position?")) {
      setError(null);
      startTransition(async () => {
        const res = await deletePosition(id);
        if (!res.success) {
          setError(res.error || "Failed to delete position");
        }
      });
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Positions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage the positions available for candidates in this voting session.
          </p>
        </div>
        {sessionStatus === "DRAFT" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "Add Position"}
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm border-b border-red-200">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200 bg-blue-50">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position Name *</label>
                <input type="text" name="name" required className="mt-1 block w-full rounded-md border-gray-300 py-1.5 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Selections *</label>
                <input type="number" name="minSelections" required min="0" defaultValue="1" className="mt-1 block w-full rounded-md border-gray-300 py-1.5 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Selections *</label>
                <input type="number" name="maxSelections" required min="1" defaultValue="1" className="mt-1 block w-full rounded-md border-gray-300 py-1.5 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Order</label>
                <input type="number" name="displayOrder" defaultValue="0" className="mt-1 block w-full rounded-md border-gray-300 py-1.5 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="isMandatory" id="isMandatory" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="isMandatory" className="ml-2 block text-sm text-gray-900">
                Is Mandatory (Voter must participate in this position)
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Save Position"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="px-4 py-5 sm:p-0">
        <ul className="divide-y divide-gray-200">
          {positions.length === 0 ? (
            <li className="px-4 py-5 text-center text-sm text-gray-500">No positions configured yet.</li>
          ) : (
            positions.map((pos) => (
              <li key={pos.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">{pos.name}</p>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>Rules: Min {pos.minSelections}, Max {pos.maxSelections}</span>
                        <span>{pos.isMandatory ? "(Mandatory)" : "(Optional)"}</span>
                        <span>Order: {pos.displayOrder}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Active Candidates ({pos.candidates.length})
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {pos.candidates.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">None</span>
                        ) : (
                          pos.candidates.map((cand) => (
                            <span key={cand.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {cand.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0 flex items-center space-x-4">
                    {sessionStatus === "DRAFT" && (
                      <button
                        onClick={() => handleDelete(pos.id, pos.candidates.length)}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
