import Link from "next/link";
import { PrismaClient, CandidateStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string, session?: string, position?: string }>;
}) {
  const awaitedSearchParams = await searchParams;
  const statusFilter = awaitedSearchParams.filter || "All";
  const sessionFilter = awaitedSearchParams.session || "All";
  const positionFilter = awaitedSearchParams.position || "All";
  
  const whereClause: Prisma.CandidateWhereInput = {};
  if (statusFilter !== "All") whereClause.status = statusFilter as CandidateStatus;
  if (sessionFilter !== "All") whereClause.position = { votingSessionId: sessionFilter };
  if (positionFilter !== "All") whereClause.positionId = positionFilter;

  const candidates = await prisma.candidate.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      position: {
        include: {
          votingSession: true
        }
      }
    }
  });

  const statuses = ["All", "ACTIVE", "INACTIVE", "PENDING", "APPROVED", "REJECTED"];
  
  // Get sessions for filter dropdown
  const sessions = await prisma.votingSession.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Candidates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all candidates across all voting sessions and positions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/candidates/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Candidate
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
          <select 
            className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
            defaultValue={statusFilter}
          >
             {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Note: In a real Next.js app we would use a client component or form to update the URL for the selects.
              For simplicity, we are showing the structure. You can use standard <Link>s or forms to push query params.
              I will use a simple client-side form approach here but wrapping it in a form is cleaner.
          */}
        </div>
        
        {/* We'll use a form with GET method to handle all filters elegantly */}
        <form method="GET" className="flex flex-wrap items-center gap-4 w-full">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select name="filter" defaultValue={statusFilter} className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm border">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Session:</label>
            <select name="session" defaultValue={sessionFilter} className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm border max-w-xs">
              <option value="All">All Sessions</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="submit" className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-200">
            Filter
          </button>
          <Link href="/admin/candidates" className="px-3 py-1.5 text-blue-600 text-sm hover:underline">
            Clear
          </Link>
        </form>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Candidate Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Voting Session</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Position</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No candidates found.
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate) => (
                      <tr key={candidate.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {candidate.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {candidate.phoneNumber || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {candidate.position.votingSession.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {candidate.position.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            candidate.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                            candidate.status === "INACTIVE" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/admin/candidates/${candidate.id}`} className="text-blue-600 hover:text-blue-900">
                            Edit<span className="sr-only">, {candidate.name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
