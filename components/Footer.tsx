import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-200 border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 py-6 md:py-10">
        
        <h2 className="text-xl font-bold text-green-700 dark:text-green-500">
          PhulariStay AI
        </h2>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-6 text-gray-600 dark:text-gray-300">
          <Link href="/about" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">
            About
          </Link>
          <Link href="/" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">
            Contact
          </Link>
          <Link href="/" className="hover:text-green-700 dark:hover:text-green-400 transition-colors">
            Privacy
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          © 2026 PhulariStay AI. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}