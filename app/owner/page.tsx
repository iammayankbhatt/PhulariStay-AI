"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function OwnerPage() {
  return (
    <ProtectedRoute roles={["OWNER", "ADMIN"]}>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-10 dark:bg-gray-950">
        <section className="mx-auto max-w-5xl rounded-lg bg-stone-200 p-6 shadow-md dark:bg-gray-900">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            Owner Dashboard
          </h1>
          <p className="mt-3 text-gray-700 dark:text-gray-200">
            Manage your homestay listings, bookings and guest reviews.
          </p>
        </section>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
