"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomestayCard from "@/components/HomestayCard";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api";
import {
  Favorite,
  getWishlist,
  removeFromWishlist,
} from "@/services/favorite.service";

export default function WishlistPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setFavorites(await getWishlist());
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to load wishlist."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchFavorites, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchFavorites]);

  const wishlistIds = useMemo(
    () => favorites.map((favorite) => favorite.homestayId),
    [favorites]
  );

  const handleRemove = useCallback(
    async (homestayId: string) => {
      try {
        await removeFromWishlist(homestayId);
        setFavorites((current) =>
          current.filter((favorite) => favorite.homestayId !== homestayId)
        );
        setToast({ message: "Removed from wishlist.", type: "success" });
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to update wishlist."),
          type: "error",
        });
      }
    },
    []
  );

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-8 dark:bg-gray-950 md:px-6">
        <div className="mx-auto max-w-7xl">
          {toast ? (
            <div className="mb-5">
              <Toast message={toast.message} type={toast.type} />
            </div>
          ) : null}

          <section className="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
            <p className="text-sm font-medium uppercase text-green-700 dark:text-green-400">
              Wishlist
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">
              Saved Homestays
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Keep track of stays you want to book later.
            </p>
          </section>

          {loading ? (
            <div className="flex min-h-[45vh] items-center justify-center">
              <Loader size={54} />
            </div>
          ) : error ? (
            <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
              <Toast message={error} type="error" />
              <Button className="mt-4" onClick={fetchFavorites}>
                <span className="inline-flex items-center gap-2">
                  <RefreshCw size={16} />
                  Retry
                </span>
              </Button>
            </section>
          ) : favorites.length ? (
            <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {favorites.map((favorite) => (
                <HomestayCard
                  key={favorite.id}
                  homestay={favorite.homestay}
                  isWishlisted={wishlistIds.includes(favorite.homestayId)}
                  onToggleWishlist={handleRemove}
                />
              ))}
            </section>
          ) : (
            <section className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <Heart className="mx-auto text-green-700 dark:text-green-400" size={42} />
              <h2 className="mt-4 text-2xl font-semibold text-gray-950 dark:text-white">
                Wishlist empty
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Tap the heart on a homestay card to save it here.
              </p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
