import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-stone-200 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-6 md:py-10">
        <h2 className="text-xl font-bold text-green-700 dark:text-green-500">
          PhulariStay AI
        </h2>

        <div className="mt-4 flex flex-col gap-2 text-gray-600 dark:text-gray-300 md:flex-row md:gap-6">
          <Link
            href="/about"
            className="transition-colors hover:text-green-700 dark:hover:text-green-400"
          >
            About
          </Link>
          <Link
            href="/"
            className="transition-colors hover:text-green-700 dark:hover:text-green-400"
          >
            Contact
          </Link>
          <Link
            href="/"
            className="transition-colors hover:text-green-700 dark:hover:text-green-400"
          >
            Privacy
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Copyright 2026 PhulariStay AI. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
