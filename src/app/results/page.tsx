"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ResultsData = {
  available: boolean;
  message?: string;
  status?: "LIVE" | "FINAL";
  sessionName?: string;
  updatedAt?: string;
  positions?: Array<{
    name: string;
    candidates: Array<{ name: string; votes: number }>;
  }>;
};

export default function ResultsPage() {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadResults = async () => {
      try {
        const response = await fetch("/api/results", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load results");
        const data = (await response.json()) as ResultsData;
        if (mounted) {
          setResults(data);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      }
    };

    void loadResults();
    const interval = window.setInterval(() => {
      if (results?.status !== "FINAL") void loadResults();
    }, 4000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [results?.status]);

  const positions = results?.positions ?? [];

  return (
    <main className="page-shell">
      <div className="page-frame">
        <header className="page-header">
          <Link href="/" className="wordmark">Batch 2023</Link>
          <Link href="/" className="home-link"><span aria-hidden="true">←</span> Home</Link>
        </header>

        <section className="results-hero">
          <p className="eyebrow">Batch 2023</p>
          <h1 className="display-heading">Results</h1>
          <div className="status-line" aria-live="polite">
            <span className={`status-dot ${results?.status === "LIVE" ? "status-dot-live" : ""}`} />
            {results?.status === "LIVE" ? "Live results" : results?.status === "FINAL" ? "Final results" : "Results"}
            {results?.status === "LIVE" && <span className="status-note">Updating automatically</span>}
          </div>
          {results?.sessionName && <p className="muted-copy">{results.sessionName}</p>}
        </section>

        {error && <div className="notice notice-error">Results could not be loaded. Please try again.</div>}

        {!results?.available && !error && (
          <div className="empty-state">
            <p className="eyebrow">Not available yet</p>
            <h2>Results are not available yet.</h2>
            <p>The results will appear here when a voting session is active or complete.</p>
          </div>
        )}

        {results?.available && (
          <div className="results-list">
            {positions.map((position) => {
              const maximum = Math.max(...position.candidates.map((candidate) => candidate.votes), 1);
              return (
                <section key={position.name} className="result-section">
                  <div className="section-kicker">Position</div>
                  <h2>{position.name}</h2>
                  <div className="candidate-results">
                    {position.candidates.map((candidate) => (
                      <div key={candidate.name} className="candidate-result">
                        <div className="candidate-result-topline">
                          <span>{candidate.name}</span>
                          <strong>{candidate.votes} <small>votes</small></strong>
                        </div>
                        <div className="result-track" aria-hidden="true">
                          <div className="result-bar" style={{ width: `${(candidate.votes / maximum) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="page-footer">
          <Link href="/vote">Vote</Link>
          <Link href="/committee">Committee</Link>
          {results?.updatedAt && <span>Updated {new Date(results.updatedAt).toLocaleTimeString()}</span>}
        </footer>
      </div>
    </main>
  );
}
