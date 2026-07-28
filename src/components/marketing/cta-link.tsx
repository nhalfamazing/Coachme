"use client";

// A Link that reports which marketing CTA was clicked. Event props carry
// the CTA slot only, never anything about the visitor.

import Link from "next/link";
import { track } from "@vercel/analytics";

export function CtaLink({
  href,
  cta,
  className,
  children,
}: {
  href: string;
  cta: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("landing_cta_click", { cta })}
    >
      {children}
    </Link>
  );
}
