"use client";

import Button from "@/components/ui/Button";

export default function AiPlannerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 dark:bg-gray-950">
      <section className="max-w-md rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
        <h1 className="text-2xl font-semibold text-gray-950 dark:text-white">
          AI Planner needs a refresh
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          We could not render the planner safely. Please try loading it again.
        </p>
        <Button className="mt-5" onClick={reset}>
          Reload planner
        </Button>
      </section>
    </main>
  );
}
