import { PrismaClient } from "@prisma/client";
import { verifyAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function AdminDashboard() {
  const isLoggedIn = await verifyAdminSession();
  if (!isLoggedIn) redirect("/admin/login");

  const [
    pendingApplications,
    totalCandidates,
    openSessions,
    eligibleVoters,
    totalVotes
  ] = await Promise.all([
    prisma.committeeApplication.count({ where: { status: "PENDING" } }),
    prisma.candidate.count(),
    prisma.votingSession.count({ where: { status: "OPEN" } }),
    prisma.voter.count({ where: { eligible: true } }),
    prisma.vote.count()
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending Applications</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{pendingApplications}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Candidates</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalCandidates}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Open Voting Sessions</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{openSessions}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Eligible Voters</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{eligibleVoters}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Votes Submitted</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalVotes}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
