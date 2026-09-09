import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results | Perizia-Crux Voting Platform",
  description: "View the results of completed voting sessions.",
};

export default function ResultsPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="max-w-lg w-full text-center space-y-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Coming Soon
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Results
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Voting results will be displayed here once voting sessions are
          complete.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-slate-500 dark:text-slate-400 underline underline-offset-4 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
