"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Homestay } from "@/types/homestay";
import { getHomestays } from "@/services/homestay.service";
import { getApiErrorMessage } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

import HomestayCard from "@/components/HomestayCard";
export default function Home() {

  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const featuredHomestays = useMemo(() => homestays, [homestays]);

  const fetchHomestays = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getHomestays();
      setHomestays(data);
    } catch (error) {
      console.error(error);
      setError(
        getApiErrorMessage(error, "Unable to fetch homestays.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchHomestays();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchHomestays]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size={60} />
      </div>
    );
  }


  return (
    <>
      <Navbar />

      <Hero />
      {error && (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <Toast
            message={error}
            type="error"
          />
          <Button
            className="mt-4"
            onClick={fetchHomestays}
          >
            Retry
          </Button>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold">
            Discover Beautiful Homestays
          </h2>

          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Handpicked stays across Uttarakhand with AI-powered travel planning.
          </p>
        </div>

        {featuredHomestays.length === 0 && !error ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No homestays are available right now.
          </div>
        ) : (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featuredHomestays.map((stay) => (
            <HomestayCard
              key={stay.id}
              homestay={stay}
            />
          ))}
        </div>
        )}
      </section>

      <Footer />
    </>
  );
}
