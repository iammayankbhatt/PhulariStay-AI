"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-10 dark:bg-gray-950">
        <section className="mx-auto max-w-3xl rounded-lg bg-stone-200 p-6 shadow-md dark:bg-gray-900">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            Profile
          </h1>
          <div className="mt-6 space-y-3 text-gray-700 dark:text-gray-200">
            <p>Name: {user?.name}</p>
            <p>Email: {user?.email}</p>
            <p>Role: {user?.role}</p>
          </div>
        </section>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
