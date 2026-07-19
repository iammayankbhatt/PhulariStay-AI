"use client";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

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

          <Link href="/ai" className="hover:text-green-700 dark:hover:text-green-400 transition">
            AI Planner
          </Link>

          {user?.role === "OWNER" || user?.role === "ADMIN" ? (
            <Link href="/owner" className="hover:text-green-700 dark:hover:text-green-400 transition">
              Owner
            </Link>
          ) : null}

          {isAuthenticated ? (
            <Link href="/profile" className="hover:text-green-700 dark:hover:text-green-400 transition">
              Profile
            </Link>
          ) : (
            <Link href="/login" className="hover:text-green-700 dark:hover:text-green-400 transition">
              Login
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href={isAuthenticated ? "/profile" : "/login"} aria-label="Profile">
            <UserCircle
              size={32}
              className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            />
          </Link>
          {isAuthenticated ? (
            <button
              aria-label="Logout"
              onClick={() => logout()}
              className="text-gray-700 transition-colors hover:text-green-700 dark:text-gray-200 dark:hover:text-green-400"
            >
              <LogOut size={24} />
            </button>
          ) : null}
        </div>
        
      </div>
    </nav>
  );
}
