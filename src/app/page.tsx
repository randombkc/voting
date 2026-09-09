import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo / Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-slate-600 dark:text-slate-300"
            aria-hidden="true"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
            Batch 2023
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Perizia-Crux
            <br />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Voting Platform
            </span>
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The official voting platform for Perizia-Crux Batch 2023. Voting
            sessions, results, and committee applications will be available
            here.
          </p>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Platform launching soon
        </div>

        {/* Nav links (placeholder) */}
        <nav
          aria-label="Platform sections"
          className="flex flex-wrap items-center justify-center gap-3 pt-4"
        >
          {[
            { href: "/vote", label: "Vote" },
            { href: "/results", label: "Results" },
            { href: "/committee", label: "Committee" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
