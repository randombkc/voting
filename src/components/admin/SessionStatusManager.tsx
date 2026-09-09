"use client";

import { useTransition, useState } from "react";
import { updateSessionStatus } from "@/app/admin/voting/actions";
import { SessionStatus } from "@prisma/client";

export default function SessionStatusManager({ 
  sessionId, 
  currentStatus, 
  positionCount 
}: { 
  sessionId: string;
  currentStatus: SessionStatus;
  positionCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (newStatus: SessionStatus) => {
    if (newStatus === "OPEN" && positionCount === 0) {
      alert("Cannot open a session that has no positions configured.");
      return;
    }

    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;

    setError(null);
    startTransition(async () => {
      const res = await updateSessionStatus(sessionId, newStatus);
      if (!res.success) {
        setError(res.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        currentStatus === "OPEN" ? "bg-green-100 text-green-800" :
        currentStatus === "CLOSED" ? "bg-red-100 text-red-800" :
        "bg-gray-100 text-gray-800"
      }`}>
        {currentStatus}
      </span>

      {currentStatus === "DRAFT" && (
        <button
          onClick={() => handleStatusChange("OPEN")}
          disabled={isPending}
          className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Open Session"}
        </button>
      )}

      {currentStatus === "OPEN" && (
        <button
          onClick={() => handleStatusChange("CLOSED")}
          disabled={isPending}
          className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Close Session"}
        </button>
      )}
      
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
