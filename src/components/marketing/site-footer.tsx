import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-wrap mk-footer-in">
        <div className="mk-logo display" aria-hidden="true">
          KOACH<span style={{ color: "#C5FF3D" }}>ME</span>
        </div>
        <nav className="mk-footer-links" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/become-a-coach">For coaches</Link>
          <Link href="/app">Open the app</Link>
        </nav>
        <p className="mk-footer-note body">
          Every number in KoachMe is real. We do not fabricate stats, coaches,
          or reviews, and AI-generated drill demos are always labeled. Built by
          a family in Miami.
        </p>
        <p className="mk-footer-note body">© 2026 KoachMe</p>
      </div>
    </footer>
  );
}
