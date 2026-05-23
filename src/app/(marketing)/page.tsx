export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center sm:gap-8 sm:px-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          CoachMe
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-400 sm:text-lg">
          The performance graph for emerging athletes.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-900 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Get started
      </button>
    </main>
  );
}
