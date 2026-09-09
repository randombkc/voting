import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <div className="home-frame">
        <header className="home-header">
          <span className="wordmark">Batch 2023</span>
          <span className="header-mark">Voting page</span>
        </header>

        <section className="home-hero">
          <p className="eyebrow">The ballot is open</p>
          <h1 className="home-title">Batch 2023<br /><em>Voting page</em></h1>
          <div className="home-rule" />
          <p className="home-number">01 <span>Make your choice count.</span></p>
        </section>

        <nav aria-label="Voting sections" className="home-actions">
          <Link href="/vote" className="action-button action-primary"><span>01</span> Vote <b>↗</b></Link>
          <Link href="/results" className="action-button"><span>02</span> Results <b>↗</b></Link>
          <Link href="/committee" className="action-button"><span>03</span> Committee <b>↗</b></Link>
        </nav>
      </div>
    </main>
  );
}
