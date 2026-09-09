import { notFound } from "next/navigation";
import Link from "next/link";
import { getApplication, getVotingSessionsByGroup } from "../../actions";
import ApplicationActions from "@/components/admin/ApplicationActions";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const application = await getApplication(awaitedParams.id);

  if (!application) {
    notFound();
  }

  // Fetch relevant voting sessions if this application wants an official committee
  let availableSessions: Awaited<ReturnType<typeof getVotingSessionsByGroup>> = [];
  if (application.status === "PENDING" && application.wantsOfficialCommittee && application.selectedGroup) {
    availableSessions = await getVotingSessionsByGroup(application.selectedGroup);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/committee" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Applications
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details submitted by the applicant.</p>
          </div>
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              application.status === "APPROVED" ? "bg-green-100 text-green-800" :
              application.status === "REJECTED" ? "bg-red-100 text-red-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {application.status}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{application.name}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{application.phoneNumber}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Selected Group</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{application.selectedGroup || "NA"}</dd>
            </div>

            {application.selectedGroup && (
              <>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Wants Official Committee</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {application.wantsOfficialCommittee ? "Yes" : "No"}
                  </dd>
                </div>
                
                {application.wantsOfficialCommittee ? (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Position Preference</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                      {application.positionPreferenceText}
                    </dd>
                  </div>
                ) : (
                  <>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Contribution Preference</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {application.contributionPreference}
                      </dd>
                    </div>
                    {application.contributionPreference === "Other" && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Other Contribution Details</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {application.otherContributionText}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Feedback / Comments</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {application.feedback}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(application.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <ApplicationActions application={application} availableSessions={availableSessions} />
    </div>
  );
}
