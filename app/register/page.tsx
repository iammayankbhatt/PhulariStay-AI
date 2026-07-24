"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthContext";
import { UserRole, getAuthErrorMessage } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "ADMIN">>("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password, role });
      router.push("/dashboard");
    } catch (authError: unknown) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-12 transition-colors dark:bg-gray-950">
        <section className="mx-auto w-full max-w-md rounded-lg bg-stone-200 p-6 shadow-md dark:bg-gray-900 md:p-8">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            Register
          </h1>

          {error ? (
            <div className="mt-5">
              <Toast message={error} type="error" />
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Name
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
              />
            </label>

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
                minLength={8}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Role
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as Exclude<UserRole, "ADMIN">)
                }
              >
                <option value="USER">USER</option>
                <option value="OWNER">OWNER</option>
              </select>
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <Loader size={18} /> : null}
                {loading ? "Creating account..." : "Register"}
              </span>
            </Button>
          </form>

          <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link className="font-medium text-green-700" href="/login">
              Login
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
