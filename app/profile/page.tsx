"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api";
import { AuthUser, getCurrentUser } from "@/services/auth.service";
import { useCallback, useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = await getCurrentUser();
      setProfile(currentUser);
    } catch (error) {
      console.error(error);
      setError(getApiErrorMessage(error, "Unable to fetch your profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProfile]);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-10 dark:bg-gray-950">
        <section className="mx-auto max-w-3xl rounded-lg bg-stone-200 p-6 shadow-md dark:bg-gray-900">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            Profile
          </h1>
          {loading ? (
            <div className="mt-8 flex justify-center">
              <Loader />
            </div>
          ) : error ? (
            <div className="mt-6">
              <Toast message={error} type="error" />
              <Button className="mt-4" onClick={fetchProfile}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-3 text-gray-700 dark:text-gray-200">
              <p>Name: {profile?.name}</p>
              <p>Email: {profile?.email}</p>
              <p>Role: {profile?.role}</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
