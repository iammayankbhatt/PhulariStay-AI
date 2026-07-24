"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarCheck,
  Clock3,
  Heart,
  Home,
  Plane,
  RefreshCw,
  Sparkles,
  UserRound,
  XCircle,
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
import { getWishlist } from "@/services/favorite.service";

const AI_HISTORY_KEY = "phularistay_ai_plan_history";

const getTime = (value) => new Date(value).getTime();

export default function DashboardPage() {
  const { user } = useAuth();
  const [homestays, setHomestays] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [aiPlans] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(AI_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [cancellingId, setCancellingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [homestayData, bookingData, wishlistData] = await Promise.all([
        getHomestays(),
        getMyBookings(),
        getWishlist(),
      ]);
      setHomestays(homestayData);
      setBookings(bookingData);
      setWishlistItems(wishlistData);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchDashboard, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboard]);

  const categorized = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      upcoming: bookings.filter(
        (booking) =>
          booking.status === "CONFIRMED" &&
          getTime(booking.checkIn) >= today.getTime()
      ),
      past: bookings.filter(
        (booking) =>
          booking.status === "CONFIRMED" &&
          getTime(booking.checkOut) < today.getTime()
      ),
      cancelled: bookings.filter((booking) => booking.status === "CANCELLED"),
      pending: bookings.filter((booking) => booking.status === "PENDING"),
      rejected: bookings.filter((booking) => booking.status === "REJECTED"),
    };
  }, [bookings]);

  const recentActivity = useMemo(() => bookings.slice(0, 5), [bookings]);

  const stats = useMemo(
    () => [
      { label: "Upcoming Trips", value: categorized.upcoming.length, icon: Plane },
      { label: "Pending Requests", value: categorized.pending.length, icon: Clock3 },
      { label: "Cancelled Trips", value: categorized.cancelled.length, icon: XCircle },
      { label: "Saved AI Plans", value: aiPlans.length, icon: Sparkles },
    ],
    [aiPlans.length, categorized]
  );

  const handleCancelBooking = useCallback(
    async (id) => {
      setCancellingId(id);
      setToast(null);

      try {
        await cancelBooking(id);
        setToast({ message: "Booking request cancelled.", type: "success" });
        await fetchDashboard();
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to cancel booking request."),
          type: "error",
        });
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
          {toast ? (
            <div className="mb-5">
              <Toast message={toast.message} type={toast.type} />
            </div>
          ) : null}

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
              <section className="mb-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                  <p className="text-sm font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                    User Dashboard
                  </p>
                  <h1 className="mt-3 text-3xl font-bold text-gray-950 dark:text-white md:text-4xl">
                    Welcome back, {user?.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
                    Track booking requests, confirmed trips, saved destinations, and AI travel plans from one place.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/ai"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-medium text-white transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      <Bot size={18} />
                      Open AI Planner
                    </Link>
                    <Link
                      href="/homestays"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-3 font-medium text-gray-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-900"
                    >
                      <Home size={18} />
                      Browse Homestays
                    </Link>
                  </div>
                </div>

                <aside className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound size={28} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                        {user?.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3">
                    <InfoPill label="Role" value={user?.role || "USER"} />
                    <InfoPill label="Live Homestays" value={homestays.length} />
                  </div>
                </aside>
              </section>

              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                        <Icon className="text-green-700 dark:text-green-400" size={20} />
                      </div>
                      <p className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">{item.value}</p>
                    </div>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                  <BookingPanel
                    title="Upcoming Trips"
                    emptyTitle="No upcoming trips"
                    emptyText="Approved bookings for future dates will appear here."
                    bookings={categorized.upcoming}
                  />
                  <BookingPanel
                    title="Pending Requests"
                    emptyTitle="No pending requests"
                    emptyText="Your booking requests waiting for owner approval will appear here."
                    bookings={categorized.pending}
                    cancellingId={cancellingId}
                    onCancel={handleCancelBooking}
                  />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <BookingPanel
                      title="Past Trips"
                      emptyTitle="No past trips"
                      emptyText="Completed stays will be listed here."
                      bookings={categorized.past}
                    />
                    <BookingPanel
                      title="Cancelled Trips"
                      emptyTitle="No cancelled trips"
                      emptyText="Cancelled booking requests will be listed here."
                      bookings={categorized.cancelled}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <SidePanel title="Wishlist">
                    {wishlistItems.length ? (
                      <div className="space-y-3">
                        {wishlistItems.slice(0, 4).map((favorite) => (
                          <Link
                            key={favorite.id}
                            href={`/homestays/${favorite.homestayId}`}
                            className="block rounded-lg border border-gray-200 p-3 transition hover:bg-green-50 dark:border-gray-800 dark:hover:bg-green-950"
                          >
                            <p className="font-medium text-gray-950 dark:text-white">
                              {favorite.homestay?.name || "Saved homestay"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {favorite.homestay?.location || "Location"}
                            </p>
                          </Link>
                        ))}
                        <Link
                          href="/wishlist"
                          className="inline-flex text-sm font-medium text-green-700 dark:text-green-400"
                        >
                          View wishlist
                        </Link>
                      </div>
                    ) : (
                      <EmptySmall icon={Heart} text="No wishlist destinations yet." />
                    )}
                  </SidePanel>

                  <SidePanel title="Saved AI Plans">
                    {aiPlans.length ? (
                      <div className="space-y-3">
                        {aiPlans.slice(0, 4).map((plan, index) => (
                          <div key={plan.id || index} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                            <p className="font-medium text-gray-950 dark:text-white">
                              {plan.title || plan.from || `AI Plan ${index + 1}`}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                              {plan.destination || plan.response || "Saved route plan"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySmall icon={Sparkles} text="No saved AI plans yet." />
                    )}
                  </SidePanel>

                  <SidePanel title="Recent Activity">
                    {recentActivity.length ? (
                      <div className="space-y-3">
                        {recentActivity.map((activity) => (
                          <ActivityItem key={activity.id} booking={activity} />
                        ))}
                      </div>
                    ) : (
                      <EmptySmall icon={Clock3} text="No recent activity found." />
                    )}
                  </SidePanel>

                  <SidePanel title="Booking Statistics">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoPill label="Total" value={bookings.length} />
                      <InfoPill label="Approved" value={categorized.upcoming.length + categorized.past.length} />
                      <InfoPill label="Rejected" value={categorized.rejected.length} />
                      <InfoPill label="Cancelled" value={categorized.cancelled.length} />
                    </div>
                  </SidePanel>
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

function BookingPanel({
  title,
  emptyTitle,
  emptyText,
  bookings,
  cancellingId = "",
  onCancel,
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">{title}</h2>

      {bookings.length ? (
        <div className="mt-5 space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link href={`/homestays/${booking.homestayId}`} className="font-semibold text-gray-950 transition hover:text-green-700 dark:text-white">
                    {booking.homestay?.name || "Booking request"}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {booking.room?.roomType || "Room"} {" - "} {booking.guests} guest(s)
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                    {booking.status}
                  </span>
                  <p className="mt-2 font-semibold text-green-700 dark:text-green-400">Rs {booking.totalPrice}</p>
                </div>
              </div>
              {onCancel && booking.status === "PENDING" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  disabled={cancellingId === booking.id}
                  onClick={() => onCancel(booking.id)}
                >
                  {cancellingId === booking.id ? "Cancelling..." : "Cancel Request"}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <CalendarCheck className="mx-auto text-green-700 dark:text-green-400" size={34} />
          <h3 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">{emptyTitle}</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{emptyText}</p>
        </div>
      )}
    </section>
  );
}

function SidePanel({ title, children }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <h2 className="text-xl font-semibold text-gray-950 dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-gray-950 dark:text-white">{value}</p>
    </div>
  );
}

function ActivityItem({ booking }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <p className="font-medium text-gray-950 dark:text-white">
        {booking.homestay?.name || "Booking activity"}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {booking.status} {" - "} Rs {booking.totalPrice}
      </p>
    </div>
  );
}

function EmptySmall({ icon: Icon, text }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
      <Icon className="mx-auto text-green-700 dark:text-green-400" size={28} />
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}
