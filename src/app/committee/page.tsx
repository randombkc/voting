import Link from "next/link";
import CommitteeForm from "@/components/CommitteeForm";

export const metadata = {
  title: "Committee | Batch 2023",
  description: "Apply to take part in the Batch 2023 committee.",
};

export default function CommitteePage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <header className="page-header">
          <Link href="/" className="wordmark">Batch 2023</Link>
          <Link href="/" className="home-link"><span aria-hidden="true">←</span> Home</Link>
        </header>
        <div className="public-intro">
          <p className="eyebrow">Batch 2023</p>
          <h1 className="display-heading display-heading-small">
          Take Part in the Committee
          </h1>
          <p className="muted-copy">
          Please fill out the following application form carefully.
          </p>
        </div>
        <CommitteeForm />
      </div>
    </main>
  );
}
