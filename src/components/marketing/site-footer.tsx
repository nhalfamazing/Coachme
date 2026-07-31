import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-wrap mk-footer-in">
        <Image src="/brand/lockup.png" alt="KoachMe" width={91} height={30} />
        <p className="mk-footer-tagline mono">
          THE PERFORMANCE GRAPH FOR EMERGING ATHLETES
        </p>
        {/* /drills, /verification and /pricing are here so every public
            page links to them: the drill library is the site's largest
            content asset and the verification standard is its most citable
            page, and neither should depend on a visitor reaching the
            landing page to be discoverable. */}
        <nav className="mk-footer-links" aria-label="Footer">
          <Link href="/drills">Drills</Link>
          <Link href="/verification">Verification</Link>
          <Link href="/pricing">Pricing</Link>
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
