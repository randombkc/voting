import { notFound } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import CandidateEditForm from "@/components/admin/CandidateEditForm";

const prisma = new PrismaClient();

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id: awaitedParams.id },
    include: {
      position: {
        include: {
          votingSession: true
        }
      }
    }
  });

  if (!candidate) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-6">
        <Link href="/admin/candidates" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Candidates
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Candidate</h3>
          <p className="mt-1 text-sm text-gray-500">
            Voting Session: <span className="font-medium text-gray-900">{candidate.position.votingSession.name}</span><br />
            Position: <span className="font-medium text-gray-900">{candidate.position.name}</span>
          </p>
          <p className="mt-2 text-xs text-red-600">
            Note: Moving a candidate between sessions or positions is not permitted. If a candidate was added to the wrong position, they must be set to INACTIVE and a new candidate created.
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <CandidateEditForm candidate={{
            id: candidate.id,
            name: candidate.name,
            phoneNumber: candidate.phoneNumber,
            status: candidate.status,
          }} />
        </div>
      </div>
    </div>
  );
}
