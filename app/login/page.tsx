"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthContext";
import { AuthUser, getAuthErrorMessage } from "@/services/auth.service";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setGoogleSession, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      return;
    }

    const user: AuthUser = {
      id: searchParams.get("id") || "",
      name: searchParams.get("name") || "",
      email: searchParams.get("email") || "",
      role: (searchParams.get("role") as AuthUser["role"]) || "USER",
      avatar: searchParams.get("avatar"),
    };

    setGoogleSession(token, user);
    router.replace("/dashboard");
  }, [router, searchParams, setGoogleSession]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (authError: unknown) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const googleUrl = `${apiUrl}/auth/google`;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-12 transition-colors dark:bg-gray-950">
        <section className="mx-auto w-full max-w-md rounded-lg bg-stone-200 p-6 shadow-md dark:bg-gray-900 md:p-8">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            Login
          </h1>

          {error ? (
            <div className="mt-5">
              <Toast message={error} type="error" />
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <Loader size={18} /> : null}
                {loading ? "Signing in..." : "Login"}
              </span>
            </Button>
          </form>

          <a
            href={googleUrl}
            className="mt-4 flex w-full items-center justify-center rounded-lg border border-green-700 px-4 py-3 font-medium text-green-700 transition hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-gray-800"
          >
            Continue with Google
          </a>

          <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            New to PhulariStay AI?{" "}
            <Link className="font-medium text-green-700" href="/register">
              Create an account
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
