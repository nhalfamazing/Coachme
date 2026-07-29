import Link from "next/link";
import Image from "next/image";
import { CtaLink } from "./cta-link";

export function SiteHeader() {
  return (
    <header className="mk-header">
      <div className="mk-wrap mk-header-in">
        <Link href="/" className="mk-logo-link" aria-label="KoachMe home">
          {/* Fixed dimensions: zero layout shift. 887x294 source. */}
          <Image src="/brand/lockup.png" alt="KoachMe" width={97} height={32} priority />
        </Link>
        <nav className="mk-nav" aria-label="Main">
          <a href="/#how-it-works">How it works</a>
          <a href="/#faq">FAQ</a>
          <Link href="/about">About</Link>
          <Link href="/become-a-coach">For coaches</Link>
        </nav>
        <div className="mk-header-cta">
          <CtaLink href="/app?signup=1" cta="header_get_started" className="mk-btn mk-btn--primary mk-btn--sm body">
            Get started
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
