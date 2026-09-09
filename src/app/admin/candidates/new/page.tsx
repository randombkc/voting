import Link from "next/link";
import CandidateForm from "@/components/admin/CandidateForm";

export default function NewCandidatePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-6">
        <Link href="/admin/candidates" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Candidates
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Candidate</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manually add a candidate to a specific position in a voting session.
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <CandidateForm />
        </div>
      </div>
    </div>
  );
}
