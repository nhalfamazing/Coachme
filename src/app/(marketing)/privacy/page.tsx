import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What KoachMe collects from athletes (name, age, sport, city, workouts), what it never collects (email, phone, birthdate, payment), and how to delete it.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "KoachMe privacy policy", url: "/privacy" },
};

// DRAFT: written to match actual current practice in the codebase as of
// July 2026. Requires review by a qualified lawyer before anyone relies
// on it. Update it whenever practice changes.

export default function PrivacyPage() {
  return (
    <main className="mk-wrap mk-prose">
      <p className="mk-prose-meta mono">Privacy policy · Last updated July 28, 2026</p>
      <h1 className="display">Privacy, in plain language</h1>

      <p className="mk-notice body">
        Draft: this policy was written to describe KoachMe&apos;s actual
        current practice and has not yet been reviewed by a lawyer. We
        publish it anyway because we think you should see it. It will be
        refined with legal review before KoachMe leaves its early phase.
      </p>

      <h2 className="display">What we collect</h2>
      <p>When an athlete creates a profile, we collect:</p>
      <ul>
        <li>First and last name</li>
        <li>Age (a number like 14, not a birthdate)</li>
        <li>Sport and position</li>
        <li>City and state</li>
        <li>Optional starting stats the athlete enters, labeled self-reported</li>
      </ul>
      <p>As the athlete uses KoachMe, we also store what they create:</p>
      <ul>
        <li>Workout logs (type, duration, intensity, notes)</li>
        <li>Posts they share to the community feed</li>
        <li>Messages they send to coaches</li>
      </ul>
      <p>
        Coaches who apply additionally provide an email address, an optional
        phone number, coaching background, and an hourly rate. Right now a
        coach&apos;s email and phone stay on the device where they applied:
        our server profiles do not store coach contact details in this phase.
      </p>

      <h2 className="display">What we do not collect from athletes</h2>
      <ul>
        <li>No email address</li>
        <li>No phone number</li>
        <li>No exact birthdate</li>
        <li>No payment information</li>
        <li>No advertising identifiers or tracking cookies</li>
      </ul>
      <p>
        Athletes sign in with a 3-word code instead of an email and password.
        That is a deliberate choice to keep children from needing another
        online account.
      </p>

      <h2 className="display">Where your data lives</h2>
      <p>
        KoachMe stores data in two places: on your own device (so the app
        works offline and loads fast) and in our database, so a profile can
        follow its athlete across devices. Messages between an athlete and a
        coach are stored so both sides can read their conversation.
      </p>

      <h2 className="display">What we never do</h2>
      <ul>
        <li>No ads on KoachMe</li>
        <li>We do not sell or rent anyone&apos;s data, ever</li>
        <li>We do not show fabricated stats, coaches, or reviews</li>
      </ul>

      <h2 className="display">Analytics and errors</h2>
      <p>
        We use Vercel Analytics to count page visits and feature use in
        aggregate, without advertising cookies. We use error reporting
        (Sentry) so we can fix crashes; error reports are technical and are
        not used for marketing.
      </p>

      <h2 className="display">Deleting your data</h2>
      <p>
        You can ask us to delete an athlete or coach profile and everything
        attached to it by contacting us at [CONTACT_EMAIL]. Clearing your
        browser storage removes the copy on your device.
      </p>

      <h2 className="display">Children</h2>
      <p>
        KoachMe is built for athletes ages 6 to 25, and for minors we expect
        a parent or guardian to create the profile together with their
        athlete and stay involved. We keep the data we collect from children
        to the minimum listed above.
      </p>

      <h2 className="display">Questions</h2>
      <p>
        Write to [CONTACT_EMAIL]. A human who works on KoachMe will answer.
      </p>
    </main>
  );
}
