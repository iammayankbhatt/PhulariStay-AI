"use client";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-stone-200 shadow-sm dark:bg-gray-900 dark:border-gray-800 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-3 md:py-4">
        
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-green-700 dark:text-green-500"
        >
          PhulariStay AI
        </Link>

        {/* Navigation Links - FIX: Added text-gray-900 (light mode) and dark:text-gray-100 (dark mode) */}
        <div className="hidden gap-8 md:flex text-gray-900 dark:text-gray-100">
          <Link href="/" className="hover:text-green-700 dark:hover:text-green-400 transition">
            Home
          </Link>

          <Link href="/about" className="hover:text-green-700 dark:hover:text-green-400 transition">
            About
          </Link>

          <Link href="/dashboard" className="hover:text-green-700 dark:hover:text-green-400 transition">
            Dashboard
          </Link>

          <Link href="/login" className="hover:text-green-700 dark:hover:text-green-400 transition">
            Login
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {/* Profile Icon - FIX: Added dark:text-gray-200 */}
          <UserCircle
            size={32}
            className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 transition-colors"
          />
        </div>
        
      </div>
    </nav>
  );
}