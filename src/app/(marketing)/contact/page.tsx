import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to reach the KoachMe team: questions, data deletion requests, coach applications, and bug reports.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact KoachMe", url: "/contact" },
};

// [CONTACT_EMAIL]: Rasheid, drop the real support address in here (it
// appears twice) and in /privacy and /terms.

export default function ContactPage() {
  return (
    <main className="mk-wrap mk-prose">
      <p className="mk-prose-meta mono">Contact</p>
      <h1 className="display">Talk to a human</h1>
      <p>
        KoachMe is built by a small family team, and mail to us is read by
        someone who actually works on the product.
      </p>
      <ul>
        <li>
          <strong>General questions and feedback:</strong> [CONTACT_EMAIL]
        </li>
        <li>
          <strong>Data deletion requests:</strong> [CONTACT_EMAIL], subject
          line &quot;Delete my data&quot;, from any member of the family
        </li>
        <li>
          <strong>Coaching:</strong> the fastest path is the{" "}
          <Link href="/become-a-coach">coach application</Link>
        </li>
        <li>
          <strong>Something broken?</strong> Tell us what you tapped and what
          happened. Screenshots help.
        </li>
      </ul>
      <p>
        We are a small team, so give us a day or two. If it is about a
        child&apos;s data, we treat it as priority.
      </p>
    </main>
  );
}
