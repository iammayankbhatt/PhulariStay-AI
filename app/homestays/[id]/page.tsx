"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  CalendarDays,
  CloudSun,
  Download,
  Heart,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import {
  Booking,
  cancelBooking,
  createBooking,
  getMyBookings,
} from "@/services/booking.service";
import { getHomestay, getHomestays } from "@/services/homestay.service";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/services/favorite.service";
import {
  createReview,
  deleteReview,
  markReviewHelpful,
  updateReview,
} from "@/services/review.service";
import { Homestay } from "@/types/homestay";

type BookingForm = {
  checkIn: string;
  checkOut: string;
  guests: string;
  roomId: string;
};

const initialBookingForm: BookingForm = {
  checkIn: "",
  checkOut: "",
  guests: "1",
  roomId: "",
};

const activeStatuses = ["PENDING", "CONFIRMED"];
const todayValue = () => new Date().toISOString().slice(0, 10);

const getNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Number.isFinite(nights) && nights > 0 ? nights : 0;
};

export default function HomestayDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [homestay, setHomestay] = useState<Homestay | null>(null);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [similarHomestays, setSimilarHomestays] = useState<Homestay[]>([]);
  const [form, setForm] = useState<BookingForm>(initialBookingForm);
  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    comment: "",
    images: "",
    visitDate: todayValue(),
  });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"summary" | "processing" | "done">("summary");
  const [receipt, setReceipt] = useState<Booking | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setToast(null);

    try {
      const [currentHomestay, allHomestays, bookings, favorites] = await Promise.all([
        getHomestay(params.id),
        getHomestays(),
        isAuthenticated ? getMyBookings() : Promise.resolve([]),
        isAuthenticated ? getWishlist() : Promise.resolve([]),
      ]);

      setHomestay(currentHomestay);
      setIsWishlisted(
        favorites.some((favorite) => favorite.homestayId === currentHomestay.id)
      );
      setExistingBooking(
        bookings.find((booking) => booking.homestayId === currentHomestay.id) ||
          null
      );
      setSimilarHomestays(
        allHomestays
          .filter(
            (item) =>
              item.id !== currentHomestay.id &&
              item.location === currentHomestay.location
          )
          .slice(0, 3)
      );
      setForm((current) => ({
        ...current,
        roomId: current.roomId || currentHomestay.rooms[0]?.id || "",
      }));
    } catch (error) {
      setToast({
        message: getApiErrorMessage(error, "Unable to load homestay details."),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, params.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchDetails();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDetails]);

  const selectedRoom = useMemo(
    () => homestay?.rooms.find((room) => room.id === form.roomId),
    [form.roomId, homestay?.rooms]
  );

  const roomAvailability = useMemo(() => {
    if (!selectedRoom) return { booked: 0, available: 0 };

    const selectedDateKey = form.checkIn || todayValue();
    const override = selectedRoom.availabilityOverrides?.find(
      (item) => item.date.slice(0, 10) === selectedDateKey
    );
    const booked = selectedRoom.bookings?.filter((booking) =>
      activeStatuses.includes(booking.status) &&
      new Date(booking.checkIn) <= new Date(selectedDateKey) &&
      new Date(booking.checkOut) > new Date(selectedDateKey)
    ).length ?? 0;
    const bookableRooms =
      override?.availableRooms ??
      selectedRoom.totalRooms ??
      selectedRoom.availableRooms;

    return {
      booked,
      available: Math.max(bookableRooms - booked, 0),
    };
  }, [form.checkIn, selectedRoom]);

  const averageRating = useMemo(() => {
    if (!homestay?.reviews.length) return "New";

    return (
      homestay.reviews.reduce((sum, review) => sum + review.rating, 0) /
      homestay.reviews.length
    ).toFixed(1);
  }, [homestay]);

  const nights = useMemo(
    () => getNights(form.checkIn, form.checkOut),
    [form.checkIn, form.checkOut]
  );

  const totalPrice = useMemo(
    () => nights * (selectedRoom?.price ?? homestay?.pricePerNight ?? 0),
    [homestay?.pricePerNight, nights, selectedRoom?.price]
  );

  const hasReviewed = useMemo(
    () => homestay?.reviews.some((review) => review.user?.id === user?.id) || false,
    [homestay?.reviews, user?.id]
  );

  const calendarDays = useMemo(() => {
    if (!selectedRoom) return [];
    const days = [];

    for (let index = 0; index < 21; index += 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const override = selectedRoom.availabilityOverrides?.find(
        (item) => item.date.slice(0, 10) === dateKey
      );
      const overlapping =
        selectedRoom.bookings?.filter((booking) => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          return checkIn <= date && checkOut > date && activeStatuses.includes(booking.status);
        }).length ?? 0;
      const total = selectedRoom.totalRooms ?? selectedRoom.availableRooms ?? 0;
      const bookableRooms = override?.availableRooms ?? total;
      const available = Math.max(bookableRooms - overlapping, 0);

      days.push({
        date,
        label: date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        available,
        status:
          available === 0
            ? "Unavailable"
            : overlapping === 0
              ? "Available"
              : "Partially Available",
      });
    }

    return days;
  }, [selectedRoom]);

  const handleBookingSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!homestay) return;

      if (!isAuthenticated) {
        setToast({
          message: "Please log in before requesting a booking.",
          type: "warning",
        });
        router.push("/login");
        return;
      }

      if (!form.checkIn || !form.checkOut || !form.roomId || !form.guests) {
        setToast({
          message: "Please complete all booking fields.",
          type: "warning",
        });
        return;
      }

      if (!nights) {
        setToast({
          message: "Check-out must be after check-in.",
          type: "warning",
        });
        return;
      }

      if (roomAvailability.available < 1) {
        setToast({
          message: "Selected room type is not available.",
          type: "error",
        });
        return;
      }

      setSubmitting(true);
      setToast(null);

      try {
        setPaymentStage("processing");
        await new Promise((resolve) => window.setTimeout(resolve, 1200));

        const booking = await createBooking({
          homestayId: homestay.id,
          roomId: form.roomId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: Number(form.guests),
        });

        setExistingBooking(booking);
        setReceipt(booking);
        setPaymentStage("done");
        setToast({
          message: "Booking Pending: request submitted. Owner approval pending.",
          type: "success",
        });
        setForm(initialBookingForm);
        await fetchDetails();
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to request booking."),
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      fetchDetails,
      form,
      homestay,
      isAuthenticated,
      nights,
      roomAvailability.available,
      router,
    ]
  );

  const handleCancelBooking = useCallback(async () => {
    if (!existingBooking || existingBooking.status !== "PENDING") return;

    setCancelling(true);
    setToast(null);

    try {
      const booking = await cancelBooking(existingBooking.id);
      setExistingBooking(booking);
      setToast({
        message: "Booking request cancelled.",
        type: "success",
      });
      await fetchDetails();
    } catch (error) {
      setToast({
        message: getApiErrorMessage(error, "Unable to cancel booking request."),
        type: "error",
      });
    } finally {
      setCancelling(false);
    }
  }, [existingBooking, fetchDetails]);

  const handleToggleWishlist = useCallback(async () => {
    if (!homestay) return;

    if (!isAuthenticated) {
      setToast({ message: "Please log in to save homestays.", type: "warning" });
      router.push("/login");
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(homestay.id);
        setIsWishlisted(false);
        setToast({ message: "Removed from wishlist.", type: "success" });
      } else {
        await addToWishlist(homestay.id);
        setIsWishlisted(true);
        setToast({ message: "Saved to wishlist.", type: "success" });
      }
    } catch (error) {
      setToast({
        message: getApiErrorMessage(error, "Unable to update wishlist."),
        type: "error",
      });
    }
  }, [homestay, isAuthenticated, isWishlisted, router]);

  const handleReviewSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!homestay) return;

      if (!isAuthenticated) {
        setToast({
          message: "Please log in to write a review.",
          type: "warning",
        });
        router.push("/login");
        return;
      }

      setReviewSubmitting(true);
      try {
        const payload = {
          homestayId: homestay.id,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
          images: reviewForm.images
            .split(",")
            .map((image) => image.trim())
            .filter(Boolean),
          visitDate: reviewForm.visitDate,
        };
        if (editingReviewId) {
          await updateReview(editingReviewId, payload);
        } else {
          await createReview(payload);
        }
        setToast({
          message: editingReviewId ? "Review updated." : "Review submitted.",
          type: "success",
        });
        setEditingReviewId(null);
        setReviewForm({
          rating: "5",
          comment: "",
          images: "",
          visitDate: todayValue(),
        });
        await fetchDetails();
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to submit review."),
          type: "error",
        });
      } finally {
        setReviewSubmitting(false);
      }
    },
    [editingReviewId, fetchDetails, homestay, isAuthenticated, reviewForm, router]
  );

  const startEditReview = useCallback((review: Homestay["reviews"][number]) => {
    setEditingReviewId(review.id);
    setReviewForm({
      rating: String(review.rating),
      comment: review.comment || "",
      images: review.images?.join(", ") || "",
      visitDate: review.visitDate?.slice(0, 10) || todayValue(),
    });
  }, []);

  const handleDeleteReview = useCallback(
    async (reviewId: string) => {
      setDeletingReviewId(reviewId);
      try {
        await deleteReview(reviewId);
        setToast({ message: "Review deleted.", type: "success" });
        if (editingReviewId === reviewId) {
          setEditingReviewId(null);
        }
        await fetchDetails();
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to delete review."),
          type: "error",
        });
      } finally {
        setDeletingReviewId("");
      }
    },
    [editingReviewId, fetchDetails]
  );

  const handleHelpful = useCallback(
    async (reviewId: string) => {
      try {
        await markReviewHelpful(reviewId);
        setToast({ message: "Marked as helpful.", type: "success" });
        await fetchDetails();
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to update review."),
          type: "error",
        });
      }
    },
    [fetchDetails]
  );

  const handleDownloadReceipt = useCallback(() => {
    if (!receipt || !homestay) return;

    const content = [
      "PhulariStay AI Booking Receipt",
      `Receipt ID: ${receipt.id}`,
      `Homestay: ${homestay.name}`,
      `Room: ${selectedRoom?.roomType || "Room"}`,
      `Check-in: ${new Date(receipt.checkIn).toLocaleDateString()}`,
      `Check-out: ${new Date(receipt.checkOut).toLocaleDateString()}`,
      `Guests: ${receipt.guests}`,
      `Total: Rs ${receipt.totalPrice}`,
      "Status: Owner Approval Pending",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `phularistay-receipt-${receipt.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [homestay, receipt, selectedRoom?.roomType]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-gray-950">
          <Loader size={56} />
        </main>
        <Footer />
      </>
    );
  }

  if (!homestay) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-100 px-4 py-10 dark:bg-gray-950">
          <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 text-center shadow-sm dark:bg-gray-900">
            {toast ? <Toast message={toast.message} type={toast.type} /> : null}
            <h1 className="mt-4 text-2xl font-semibold">Homestay not found</h1>
            <Button className="mt-5" onClick={() => router.push("/")}>
              Browse Homestays
            </Button>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const images = homestay.images?.length ? homestay.images : [homestay.image || "/window.svg"];
  const mapQuery = encodeURIComponent(
    homestay.address || `${homestay.name}, ${homestay.location}`
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-6 dark:bg-gray-950 md:px-6">
        <div className="mx-auto max-w-7xl">
          {toast ? (
            <div className="mb-5">
              <Toast message={toast.message} type={toast.type} />
            </div>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
              <img
                src={images[0]}
                alt={homestay.name}
                className="h-72 w-full object-cover md:h-[420px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {images.slice(1, 5).map((image) => (
                <img
                  key={image}
                  src={image}
                  alt={`${homestay.name} gallery`}
                  className="h-36 w-full rounded-lg object-cover shadow-sm md:h-[calc((420px-1rem)/2)]"
                />
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-950 dark:text-white">
                      {homestay.name}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin size={18} />
                      {homestay.address || homestay.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                    <Star className="fill-yellow-400 text-yellow-400" size={18} />
                    {averageRating}
                  </div>
                </div>

                <p className="mt-5 leading-7 text-gray-700 dark:text-gray-200">
                  {homestay.description}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={handleToggleWishlist}
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart className={isWishlisted ? "fill-red-500 text-red-500" : ""} size={18} />
                    {isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                  </span>
                </Button>
              </section>

              <InfoGrid homestay={homestay} />

              <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                <h2 className="text-2xl font-semibold">Room Types</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {homestay.rooms.map((room) => {
                    const booked =
                      room.bookings?.filter((booking) =>
                        activeStatuses.includes(booking.status)
                      ).length ?? 0;
                    const available =
                      room.bookings && room.totalRooms !== undefined
                        ? Math.max(room.totalRooms - booked, 0)
                        : room.availableRooms;

                    return (
                      <div
                        key={room.id}
                        className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <img
                          src={room.images?.[0] || images[0]}
                          alt={`${room.roomType || "Room"} at ${homestay.name}`}
                          className="h-44 w-full object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold">{room.roomType}</h3>
                          {room.images && room.images.length > 1 ? (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                              {room.images.slice(1, 5).map((image) => (
                                <img
                                  key={image}
                                  src={image}
                                  alt={`${room.roomType || "Room"} preview`}
                                  className="h-16 w-20 flex-none rounded-md object-cover"
                                />
                              ))}
                            </div>
                          ) : null}
                          <p className="mt-2 text-sm text-gray-500">
                            Capacity: {room.capacity} guest(s)
                          </p>
                          <p className="mt-3 text-lg font-bold text-green-700 dark:text-green-400">
                            Rs {room.price} / night
                          </p>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                            <Stat label="Total" value={room.totalRooms ?? 0} />
                            <Stat label="Booked" value={booked} />
                            <Stat label="Available" value={available} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                <h2 className="text-2xl font-semibold">Google Map</h2>
                <iframe
                  title={`${homestay.name} map`}
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  className="mt-4 h-72 w-full rounded-lg border-0"
                  loading="lazy"
                />
              </section>

              <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                <h2 className="text-2xl font-semibold">Reviews</h2>
                {isAuthenticated && (!hasReviewed || editingReviewId) ? (
                  <form className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-800" onSubmit={handleReviewSubmit}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold">
                        {editingReviewId ? "Edit review" : "Write a review"}
                      </h3>
                      {editingReviewId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(null);
                            setReviewForm({
                              rating: "5",
                              comment: "",
                              images: "",
                              visitDate: todayValue(),
                            });
                          }}
                          className="text-sm font-medium text-gray-600 hover:text-green-700 dark:text-gray-300"
                        >
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Field label="Rating" type="number" min="1" value={reviewForm.rating} onChange={(value) => setReviewForm((current) => ({ ...current, rating: value }))} />
                      <Field label="Visit Date" type="date" value={reviewForm.visitDate} onChange={(value) => setReviewForm((current) => ({ ...current, visitDate: value }))} />
                    </div>
                    <label className="mt-3 block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Comment</span>
                      <textarea
                        rows={3}
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
                        required
                      />
                    </label>
                    <Field label="Images" value={reviewForm.images} onChange={(value) => setReviewForm((current) => ({ ...current, images: value }))} />
                    <Button className="mt-4" type="submit" disabled={reviewSubmitting || reviewForm.comment.trim().length < 5}>
                      {reviewSubmitting
                        ? "Saving..."
                        : editingReviewId
                          ? "Update Review"
                          : "Submit Review"}
                    </Button>
                  </form>
                ) : null}
                {homestay.reviews.length ? (
                  <div className="mt-4 space-y-3">
                    {homestay.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                      >
                        <p className="font-medium">
                          {review.user?.fullName || "Guest"} rated {review.rating}/5
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Visit: {review.visitDate ? new Date(review.visitDate).toLocaleDateString() : "Not specified"}
                        </p>
                        {review.comment ? (
                          <p className="mt-2 text-gray-600 dark:text-gray-300">
                            {review.comment}
                          </p>
                        ) : null}
                        {review.images?.length ? (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {review.images.map((image) => (
                              <img key={image} src={image} alt="Review" className="h-16 w-20 rounded-md object-cover" />
                            ))}
                          </div>
                        ) : null}
                        {review.ownerReply ? (
                          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
                            <strong>Owner reply:</strong> {review.ownerReply}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleHelpful(review.id)}
                          className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-950"
                        >
                          Helpful ({review.helpfulCount || 0})
                        </button>
                        {(review.user?.id === user?.id || user?.role === "ADMIN") ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {review.user?.id === user?.id ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="px-3 py-2 text-sm"
                                onClick={() => startEditReview(review)}
                              >
                                Edit
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-2 text-sm"
                              disabled={deletingReviewId === review.id}
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              {deletingReviewId === review.id
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700">
                    No reviews yet.
                  </div>
                )}
              </section>

              <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                <h2 className="text-2xl font-semibold">Similar Homestays</h2>
                {similarHomestays.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {similarHomestays.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => router.push(`/homestays/${item.id}`)}
                        className="rounded-lg border border-gray-200 p-4 text-left transition hover:bg-green-50 dark:border-gray-800 dark:hover:bg-green-950"
                      >
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.location}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700">
                    No similar homestays found nearby.
                  </div>
                )}
              </section>
            </div>

            <aside className="h-fit rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900 lg:sticky lg:top-6">
              <p className="text-sm text-gray-500">Starting from</p>
              <p className="mt-1 text-3xl font-bold text-green-700 dark:text-green-400">
                Rs {homestay.pricePerNight}
                <span className="text-sm font-normal text-gray-500"> / night</span>
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  setPaymentStage("summary");
                  setReceipt(null);
                  setBookingOpen(true);
                }}
              >
                {existingBooking ? "View Booking Request" : "Book Now"}
              </Button>
              {existingBooking ? (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                  <p className="font-semibold">
                    Booking request{" "}
                    {existingBooking.status === "CONFIRMED"
                      ? "accepted"
                      : "received"}
                  </p>
                  <p className="mt-1">Status: {existingBooking.status}</p>
                  <p className="mt-1">
                    {new Date(existingBooking.checkIn).toLocaleDateString()} to{" "}
                    {new Date(existingBooking.checkOut).toLocaleDateString()}
                  </p>
                  {existingBooking.status === "PENDING" ? (
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      disabled={cancelling}
                      className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      {cancelling ? "Cancelling..." : "Cancel Request"}
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p className="flex items-center gap-2">
                  <ShieldCheck size={17} /> Booking requests stay pending.
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays size={17} /> Host confirmation required.
                </p>
              </div>
              <div className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <h3 className="font-semibold text-gray-950 dark:text-white">Booking Calendar</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {calendarDays.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className={`rounded-lg p-2 text-center ${
                        day.status === "Unavailable"
                          ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                          : day.status === "Partially Available"
                            ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                            : "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                      }`}
                    >
                      <p className="font-medium">{day.label}</p>
                      <p>{day.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={bookingOpen}
        title="Request Booking"
        onClose={() => {
          if (!submitting) setBookingOpen(false);
        }}
      >
        <form className="space-y-4" onSubmit={handleBookingSubmit}>
          {paymentStage === "processing" ? (
            <div className="rounded-lg bg-stone-50 p-8 text-center dark:bg-gray-950">
              <Loader size={42} />
              <p className="mt-4 font-medium">Processing fake payment...</p>
            </div>
          ) : paymentStage === "done" && receipt ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
              <h3 className="text-lg font-semibold">Booking Request Submitted</h3>
              <p className="mt-2">Owner Approval Pending</p>
              <p className="mt-2 text-sm">Receipt ID: {receipt.id}</p>
              <Button type="button" className="mt-4" onClick={handleDownloadReceipt}>
                <span className="inline-flex items-center gap-2">
                  <Download size={17} />
                  Download Receipt
                </span>
              </Button>
            </div>
          ) : (
            <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Check-in"
              type="date"
              min={todayValue()}
              value={form.checkIn}
              onChange={(value) => setForm((current) => ({ ...current, checkIn: value }))}
            />
            <Field
              label="Check-out"
              type="date"
              min={form.checkIn || todayValue()}
              value={form.checkOut}
              onChange={(value) => setForm((current) => ({ ...current, checkOut: value }))}
            />
            <Field
              label="Guests"
              type="number"
              min="1"
              value={form.guests}
              onChange={(value) => setForm((current) => ({ ...current, guests: value }))}
            />
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Room Type
              </span>
              <select
                value={form.roomId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, roomId: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
              >
                {homestay.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomType} - Rs {room.price}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="rounded-lg bg-stone-50 p-4 dark:bg-gray-950">
            <h3 className="font-semibold">Booking Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>Room: {selectedRoom?.roomType || "Select room"}</p>
              <p>Nights: {nights}</p>
              <p>Booked Rooms: {roomAvailability.booked}</p>
              <p>Available Rooms: {roomAvailability.available}</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                Total: Rs {totalPrice}
              </p>
              <p>Status after request: PENDING</p>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setBookingOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Processing..." : "Proceed"}
            </Button>
          </div>
            </>
          )}
        </form>
      </Modal>
    </>
  );
}

function InfoGrid({ homestay }: { homestay: Homestay }) {
  const attractions = [
    `${homestay.location} market`,
    `Local viewpoints near ${homestay.location}`,
    `Village walks around ${homestay.location}`,
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Panel title="Amenities">
        <div className="flex flex-wrap gap-2">
          {homestay.amenities?.length ? (
            homestay.amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-800 dark:bg-green-950 dark:text-green-300"
              >
                {amenity}
              </span>
            ))
          ) : (
            <p className="text-gray-500">Amenities not listed.</p>
          )}
        </div>
      </Panel>

      <Panel title="Owner Details">
        <div className="flex items-center gap-3">
          <UserRound className="text-green-700 dark:text-green-400" />
          <div>
            <p className="font-semibold">{homestay.owner?.fullName || "Host"}</p>
            <p className="text-sm text-gray-500">{homestay.owner?.email}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Civic Score">
        <p className="text-3xl font-bold text-green-700 dark:text-green-400">
          {homestay.owner?.civicScore?.score ?? 100}
        </p>
        <p className="text-sm text-gray-500">
          Reports: {homestay.owner?.civicScore?.totalReports ?? 0}
        </p>
      </Panel>

      <Panel title="Weather">
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <CloudSun size={18} />
          Check local forecast before travel for {homestay.location}.
        </p>
      </Panel>

      <Panel title="Nearby Attractions">
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          {attractions.map((attraction) => (
            <li key={attraction} className="flex items-center gap-2">
              <Navigation size={16} />
              {attraction}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="AI Recommendations">
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Bot size={18} />
          Use the AI Planner to generate a route-aware itinerary for this stay.
        </p>
      </Panel>
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-stone-50 p-2 text-center dark:bg-gray-950">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
      />
    </label>
  );
}
