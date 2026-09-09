import CommitteeForm from "@/components/CommitteeForm";

export const metadata = {
  title: "Committee Application | Perizia-Crux",
  description: "Apply to take part in the Perizia or Crux committee.",
};

export default function CommitteePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Take Part in the Committee
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Please fill out the following application form carefully.
        </p>
      </div>

      <CommitteeForm />
    </div>
  );
}
