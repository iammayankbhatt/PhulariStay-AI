"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarCheck,
  Clock3,
  Home,
  RefreshCw,
  UserRound,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthContext";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api";
import { cancelBooking, getMyBookings } from "@/services/booking.service";
import { getHomestays } from "@/services/homestay.service";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [cancellingId, setCancellingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [homestays, bookings] = await Promise.all([
        getHomestays(),
        getMyBookings(),
      ]);
      setDashboard({
        user,
        homestays,
        savedTrips: bookings,
        recentActivity: bookings.slice(0, 5),
      });
    } catch (error) {
      console.error(error);
      setError(getApiErrorMessage(error, "Unable to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboard]);

  const totalHomestays = dashboard?.homestays.length ?? 0;
  const savedTrips = dashboard?.savedTrips ?? [];
  const recentActivity = dashboard?.recentActivity ?? [];

  const stats = useMemo(
    () => [
      {
        label: "Total Homestays",
        value: totalHomestays,
        icon: Home,
      },
      {
        label: "Saved Trips",
        value: savedTrips.length,
        icon: CalendarCheck,
      },
      {
        label: "Recent Activity",
        value: recentActivity.length,
        icon: Clock3,
      },
    ],
    [recentActivity.length, savedTrips.length, totalHomestays]
  );

  const handleCancelBooking = useCallback(
    async (id) => {
      setCancellingId(id);
      setError("");

      try {
        await cancelBooking(id);
        await fetchDashboard();
      } catch (error) {
        console.error(error);
        setError(getApiErrorMessage(error, "Unable to cancel booking request."));
      } finally {
        setCancellingId("");
      }
    },
    [fetchDashboard]
  );

  return (
    <ProtectedRoute>
      <Navbar />

      <main className="min-h-screen bg-stone-100 px-4 py-6 transition-colors duration-200 dark:bg-gray-950 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <Loader size={56} />
            </div>
          ) : error ? (
            <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
              <Toast message={error} type="error" />
              <Button className="mt-4" onClick={fetchDashboard}>
                <span className="inline-flex items-center gap-2">
                  <RefreshCw size={16} />
                  Retry
                </span>
              </Button>
            </section>
          ) : (
            <>
              <section className="mb-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                  <p className="text-sm font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                    Dashboard
                  </p>
                  <h1 className="mt-3 text-3xl font-bold text-gray-950 dark:text-white md:text-4xl">
                    Welcome back, {dashboard?.user.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
                    View your account, explore live homestay inventory, and jump into AI trip planning from one place.
                  </p>
                  <Link
                    href="/ai"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-medium text-white transition hover:bg-green-800"
                  >
                    <Bot size={18} />
                    Open AI Planner
                  </Link>
                </div>

                <aside className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                      <UserRound size={26} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                        {dashboard?.user.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dashboard?.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      User role
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                      {dashboard?.user.role}
                    </p>
                  </div>
                </aside>
              </section>

              <section className="mb-8 grid gap-4 md:grid-cols-3">
                {stats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.label}
                        </p>
                        <Icon className="text-green-700 dark:text-green-400" size={20} />
                      </div>
                      <p className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </section>

              <section className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900 lg:col-span-2">
                  <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                    Saved Trips
                  </h2>

                  {savedTrips.length ? (
                    <div className="mt-5 space-y-3">
                      {savedTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                        >
                          <Link
                            href={`/homestays/${trip.homestayId}`}
                            className="font-medium hover:text-green-700"
                          >
                            {trip.homestay?.name || "Booking request"}
                          </Link>
                          <p className="mt-1 text-sm text-gray-500">
                            {trip.status} · Rs {trip.totalPrice}
                          </p>
                          {trip.status === "PENDING" ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-3"
                              disabled={cancellingId === trip.id}
                              onClick={() => handleCancelBooking(trip.id)}
                            >
                              {cancellingId === trip.id
                                ? "Cancelling..."
                                : "Cancel Request"}
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                      <CalendarCheck className="mx-auto text-green-700 dark:text-green-400" size={34} />
                      <h3 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
                        No saved trips yet
                      </h3>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Trips you save from the planner will appear here once the backend provides them.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                  <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                    Recent Activity
                  </h2>

                  {recentActivity.length ? (
                    <div className="mt-5 space-y-3">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                        >
                          <p className="font-medium">
                            {activity.homestay?.name || "Booking activity"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {activity.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                      <Clock3 className="mx-auto text-green-700 dark:text-green-400" size={30} />
                      <p className="mt-3 text-gray-500 dark:text-gray-400">
                        No recent activity found.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </ProtectedRoute>
  );
}
