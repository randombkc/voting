"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveApplication, rejectApplication } from "@/app/admin/actions";
import { CommitteeApplication, VotingSession, Position } from "@prisma/client";

type VotingSessionWithPositions = VotingSession & { positions: Position[] };

export default function ApplicationActions({
  application,
  availableSessions,
}: {
  application: CommitteeApplication;
  availableSessions: VotingSessionWithPositions[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (application.status !== "PENDING") {
    return null;
  }

  const handleApprove = () => {
    setError(null);
    if (application.wantsOfficialCommittee && application.selectedGroup) {
      setShowSessionModal(true);
    } else {
      executeApprove();
    }
  };

  const handleReject = () => {
    if (!confirm("Are you sure you want to reject this application?")) return;
    
    setError(null);
    startTransition(async () => {
      const res = await rejectApplication(application.id);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to reject application.");
      }
    });
  };

  const executeApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveApplication(application.id, selectedSessionId || undefined);
      if (res.success) {
        setShowSessionModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to approve application.");
      }
    });
  };

  return (
    <div className="mt-6 flex space-x-4">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? "Processing..." : "Approve"}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? "Processing..." : "Reject"}
      </button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {showSessionModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowSessionModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                  Select Voting Session
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    This applicant chose <strong>{application.positionPreferenceText}</strong>. Please select the correct Voting Session for this candidate.
                  </p>
                  
                  <div className="mt-4">
                    <label htmlFor="session" className="block text-sm font-medium text-gray-700">Voting Session</label>
                    <select
                      id="session"
                      name="session"
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                    >
                      <option value="">-- Select a Session --</option>
                      {availableSessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name} ({session.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedSessionId && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                      <strong>Positions in this session:</strong>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        {availableSessions.find(s => s.id === selectedSessionId)?.positions.map(p => (
                          <li key={p.id} className={p.name === application.positionPreferenceText ? "text-green-600 font-bold" : ""}>
                            {p.name}
                          </li>
                        ))}
                      </ul>
                      {!availableSessions.find(s => s.id === selectedSessionId)?.positions.some(p => p.name === application.positionPreferenceText) && (
                        <p className="text-red-500 mt-2 font-bold">Warning: The required position is not present in this session. The transaction will fail.</p>
                      )}
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  disabled={!selectedSessionId || isPending}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={executeApprove}
                >
                  {isPending ? "Approving..." : "Confirm & Approve"}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowSessionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
