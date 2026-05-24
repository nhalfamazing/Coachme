import { ConnectCard } from "@/components/connect-card";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12 sm:gap-12 sm:px-10 sm:py-16">
      <header className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Phase 0
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          CoachMe
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          The performance graph for emerging athletes.
        </p>
      </header>

      <ConnectCard />
    </main>
  );
}
