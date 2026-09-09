import { notFound } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import SessionStatusManager from "@/components/admin/SessionStatusManager";
import PositionManager from "@/components/admin/PositionManager";

const prisma = new PrismaClient();

export default async function VotingSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const session = await prisma.votingSession.findUnique({
    where: { id: awaitedParams.id },
    include: {
      positions: {
        orderBy: { displayOrder: "asc" },
        include: {
          candidates: {
            where: { status: "ACTIVE" }, // Only display ACTIVE candidates per requirements
            orderBy: { name: "asc" }
          }
        }
      }
    }
  });

  if (!session) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      <div className="mb-2">
        <Link href="/admin/voting" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Voting Sessions
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{session.name}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Group: {session.group}</p>
          </div>
          <SessionStatusManager sessionId={session.id} currentStatus={session.status} positionCount={session.positions.length} />
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Schedule</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {session.startTime ? new Date(session.startTime).toLocaleString() : 'TBD'} 
                {' — '} 
                {session.endTime ? new Date(session.endTime).toLocaleString() : 'TBD'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <PositionManager
        sessionId={session.id}
        sessionStatus={session.status}
        positions={session.positions as Array<{
          id: string;
          name: string;
          minSelections: number;
          maxSelections: number;
          isMandatory: boolean;
          displayOrder: number;
          candidates: { id: string; name: string }[];
        }>}
      />

    </div>
  );
}
