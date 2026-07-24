"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Edit3,
  Home,
  Image as ImageIcon,
  MapPin,
  Plus,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import {
  acceptBookingRequest,
  Booking,
  getOwnerBookingRequests,
  rejectBookingRequest,
} from "@/services/booking.service";
import {
  createHomestay,
  deleteHomestay,
  getHomestays,
  updateRoomDateAvailability,
  updateHomestay,
} from "@/services/homestay.service";
import {
  createCivicReview,
  deleteReview,
  replyToReview,
} from "@/services/review.service";
import { Homestay, HomestayPayload } from "@/types/homestay";

type FormState = {
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  address: string;
  pricePerNight: string;
  description: string;
  images: string;
  amenities: string;
  rooms: RoomForm[];
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type RoomForm = {
  id?: string;
  roomType: string;
  totalRooms: string;
  availableRooms: string;
  capacity: string;
  price: string;
  images: string;
};

const emptyRoom: RoomForm = {
  roomType: "STANDARD",
  totalRooms: "1",
  availableRooms: "1",
  capacity: "2",
  price: "",
  images: "",
};

const emptyForm: FormState = {
  name: "",
  location: "",
  latitude: "",
  longitude: "",
  address: "",
  pricePerNight: "",
  description: "",
  images: "",
  amenities: "",
  rooms: [emptyRoom],
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toFormState = (homestay: Homestay): FormState => ({
  name: homestay.name ?? "",
  location: homestay.location ?? "",
  latitude: String(homestay.latitude ?? ""),
  longitude: String(homestay.longitude ?? ""),
  address: homestay.address ?? "",
  pricePerNight: String(homestay.pricePerNight ?? ""),
  description: homestay.description ?? "",
  images: homestay.images?.join(", ") ?? "",
  amenities: homestay.amenities?.join(", ") ?? "",
  rooms: homestay.rooms.length
    ? homestay.rooms.map((room) => ({
        id: room.id,
        roomType: room.roomType || "STANDARD",
        totalRooms: String(room.totalRooms ?? 1),
        availableRooms: String(room.availableRooms ?? 0),
        capacity: String(room.capacity ?? 1),
        price: String(room.price ?? ""),
        images: room.images?.join(", ") ?? "",
      }))
    : [emptyRoom],
});

function validateForm(form: FormState) {
  const errors: FormErrors = {};
  const images = splitList(form.images);
  const amenities = splitList(form.amenities);
  const price = Number(form.pricePerNight);
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);

  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.location.trim()) errors.location = "Location is required.";
  if (!form.address.trim()) errors.address = "Address is required.";
  if (!form.pricePerNight.trim() || Number.isNaN(price) || price <= 0) {
    errors.pricePerNight = "Enter a valid positive price.";
  }
  if (form.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters.";
  }
  if (!images.length) errors.images = "Add at least one image URL.";
  if (!amenities.length) errors.amenities = "Add at least one amenity.";
  if (!form.latitude.trim() || Number.isNaN(latitude)) {
    errors.latitude = "Latitude is required.";
  }
  if (!form.longitude.trim() || Number.isNaN(longitude)) {
    errors.longitude = "Longitude is required.";
  }
  if (!form.rooms.length) {
    errors.rooms = "Add at least one room type.";
  }
  form.rooms.forEach((room) => {
    const totalRooms = Number(room.totalRooms);
    const availableRooms = Number(room.availableRooms);
    const capacity = Number(room.capacity);
    const roomPrice = Number(room.price);

    if (
      !room.roomType ||
      !Number.isInteger(totalRooms) ||
      totalRooms < 1 ||
      !Number.isInteger(availableRooms) ||
      availableRooms < 0 ||
      availableRooms > totalRooms ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      Number.isNaN(roomPrice) ||
      roomPrice <= 0
    ) {
      errors.rooms =
        "Each room needs type, total rooms, valid available rooms, capacity, and price.";
    }
  });

  return errors;
}

function buildPayload(form: FormState): HomestayPayload {
  return {
    name: form.name.trim(),
    location: form.location.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    address: form.address.trim(),
    pricePerNight: Number(form.pricePerNight),
    description: form.description.trim(),
    images: splitList(form.images),
    amenities: splitList(form.amenities),
    rooms: form.rooms.map((room) => ({
      id: room.id,
      roomType: room.roomType,
      totalRooms: Number(room.totalRooms),
      availableRooms: Number(room.availableRooms),
      capacity: Number(room.capacity),
      price: Number(room.price),
      images: splitList(room.images),
    })),
  };
}

export default function OwnerPage() {
  const { user } = useAuth();
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingHomestay, setEditingHomestay] = useState<Homestay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Homestay | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState("");
  const [reviewReplies, setReviewReplies] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const [civicReviewTarget, setCivicReviewTarget] = useState<Booking | null>(
    null
  );
  const [civicReviewForm, setCivicReviewForm] = useState({
    rating: "5",
    comment: "",
    images: "",
  });
  const [savingCivicReview, setSavingCivicReview] = useState(false);
  const [availabilityTarget, setAvailabilityTarget] = useState<{
    homestayId: string;
    room: Homestay["rooms"][number];
    date: string;
    label: string;
    bookedRooms: number;
    currentAvailable: number;
  } | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    availableRooms: "",
    note: "",
  });
  const [savingDateAvailability, setSavingDateAvailability] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const fetchHomestays = useCallback(async (clearToast = true) => {
    setLoading(true);
    if (clearToast) {
      setToast(null);
    }

    try {
      const [homestayData, requestData] = await Promise.all([
        getHomestays(),
        getOwnerBookingRequests(),
      ]);
      setHomestays(homestayData);
      setBookingRequests(requestData);
    } catch (error) {
      setToast({
        message: getApiErrorMessage(error, "Unable to fetch homestays."),
        type: "error",
      });
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

  const ownerHomestays = useMemo(() => {
    if (!user?.id || user.role === "ADMIN") return homestays;

    return homestays.filter((homestay) => homestay.ownerId === user.id);
  }, [homestays, user]);

  const totalValue = useMemo(
    () =>
      ownerHomestays.reduce(
        (sum, homestay) => sum + (homestay.pricePerNight ?? 0),
        0
      ),
    [ownerHomestays]
  );

  const pendingRequests = useMemo(
    () =>
      bookingRequests.filter((booking) => booking.status === "PENDING").length,
    [bookingRequests]
  );

  const ownerStats = useMemo(() => {
    const confirmedBookings = bookingRequests.filter(
      (booking) => booking.status === "CONFIRMED"
    );
    const rejectedBookings = bookingRequests.filter(
      (booking) => booking.status === "REJECTED"
    );
    const totalRooms = ownerHomestays.reduce(
      (sum, homestay) =>
        sum +
        homestay.rooms.reduce(
          (roomSum, room) => roomSum + (room.totalRooms || 0),
          0
        ),
      0
    );
    const availableRooms = ownerHomestays.reduce(
      (sum, homestay) =>
        sum +
        homestay.rooms.reduce(
          (roomSum, room) => roomSum + (room.availableRooms || 0),
          0
        ),
      0
    );
    const ratings = ownerHomestays.flatMap((homestay) =>
      (homestay.reviews || []).map((review) => review.rating)
    );
    const revenue = confirmedBookings.reduce(
      (sum, booking) => sum + (booking.totalPrice || 0),
      0
    );
    const occupancy = totalRooms
      ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100)
      : 0;
    const averageRating = ratings.length
      ? (
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        ).toFixed(1)
      : "0.0";

    return {
      revenue,
      bookings: bookingRequests.length,
      approved: confirmedBookings.length,
      rejected: rejectedBookings.length,
      occupancy,
      averageRating,
      recentReviews: ownerHomestays
        .flatMap((homestay) =>
          (homestay.reviews || []).map((review) => ({
            ...review,
            homestayName: homestay.name,
          }))
        )
        .slice(0, 4),
    };
  }, [bookingRequests, ownerHomestays]);

  const quickStats = useMemo(
    () => [
      {
        label: "My Properties",
        value: ownerHomestays.length,
        icon: Home,
      },
      {
        label: "Revenue",
        value: `Rs ${ownerStats.revenue}`,
        icon: BarChart3,
      },
      {
        label: "Bookings",
        value: ownerStats.bookings,
        icon: CalendarCheck,
      },
      {
        label: "Pending Requests",
        value: pendingRequests,
        icon: CalendarCheck,
      },
      {
        label: "Approved",
        value: ownerStats.approved,
        icon: CheckCircle2,
      },
      {
        label: "Rejected",
        value: ownerStats.rejected,
        icon: XCircle,
      },
      {
        label: "Occupancy",
        value: `${ownerStats.occupancy}%`,
        icon: BarChart3,
      },
      {
        label: "Average Rating",
        value: ownerStats.averageRating,
        icon: Star,
      },
    ],
    [ownerHomestays.length, ownerStats, pendingRequests]
  );

  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    },
    []
  );

  const handleRoomChange = useCallback(
    (index: number, field: keyof RoomForm, value: string) => {
      setForm((current) => ({
        ...current,
        rooms: current.rooms.map((room, roomIndex) =>
          roomIndex === index ? { ...room, [field]: value } : room
        ),
      }));
      setFormErrors((current) => ({ ...current, rooms: undefined }));
    },
    []
  );

  const addRoom = useCallback(() => {
    setForm((current) => ({
      ...current,
      rooms: [...current.rooms, { ...emptyRoom }],
    }));
  }, []);

  const removeRoom = useCallback((index: number) => {
    setForm((current) => ({
      ...current,
      rooms:
        current.rooms.length === 1
          ? current.rooms
          : current.rooms.filter((_, roomIndex) => roomIndex !== index),
    }));
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingHomestay(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((homestay: Homestay) => {
    setEditingHomestay(homestay);
    setForm(toFormState(homestay));
    setFormErrors({});
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    if (submitting) return;

    setIsFormOpen(false);
    setEditingHomestay(null);
    setForm(emptyForm);
    setFormErrors({});
  }, [submitting]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const errors = validateForm(form);
      setFormErrors(errors);

      if (Object.keys(errors).length) {
        setToast({
          message: "Please fix the highlighted fields.",
          type: "warning",
        });
        return;
      }

      setSubmitting(true);
      setToast(null);

      try {
        const payload = buildPayload(form);

        if (editingHomestay) {
          await updateHomestay(editingHomestay.id, payload);
          setToast({
            message: "Homestay updated successfully.",
            type: "success",
          });
        } else {
          await createHomestay(payload);
          setToast({
            message: "Homestay created successfully.",
            type: "success",
          });
        }

        closeForm();
        await fetchHomestays(false);
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to save homestay."),
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingHomestay, fetchHomestays, form]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setToast(null);

    try {
      await deleteHomestay(deleteTarget.id);
      setToast({
        message: "Homestay deleted successfully.",
        type: "success",
      });
      setDeleteTarget(null);
      await fetchHomestays(false);
    } catch (error) {
      setToast({
        message: getApiErrorMessage(error, "Unable to delete homestay."),
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchHomestays]);

  const handleBookingDecision = useCallback(
    async (bookingId: string, decision: "accept" | "reject") => {
      setUpdatingBookingId(bookingId);
      setToast(null);

      try {
        if (decision === "accept") {
          await acceptBookingRequest(bookingId);
          setToast({
            message: "Booking request accepted.",
            type: "success",
          });
        } else {
          await rejectBookingRequest(bookingId);
          setToast({
            message: "Booking request rejected.",
            type: "success",
          });
        }

        await fetchHomestays(false);
      } catch (error) {
        setToast({
          message: getApiErrorMessage(
            error,
            "Unable to update booking request."
          ),
          type: "error",
        });
      } finally {
        setUpdatingBookingId("");
      }
    },
    [fetchHomestays]
  );

  const handleReviewReply = useCallback(
    async (reviewId: string) => {
      const ownerReply = reviewReplies[reviewId]?.trim();

      if (!ownerReply) {
        setToast({
          message: "Please enter a reply before submitting.",
          type: "warning",
        });
        return;
      }

      setReplyingReviewId(reviewId);
      setToast(null);

      try {
        await replyToReview(reviewId, ownerReply);
        setToast({ message: "Owner reply posted.", type: "success" });
        setReviewReplies((current) => ({ ...current, [reviewId]: "" }));
        await fetchHomestays(false);
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to reply to review."),
          type: "error",
        });
      } finally {
        setReplyingReviewId("");
      }
    },
    [fetchHomestays, reviewReplies]
  );

  const handleDeleteReview = useCallback(
    async (reviewId: string) => {
      setDeletingReviewId(reviewId);
      setToast(null);

      try {
        await deleteReview(reviewId);
        setToast({ message: "Review deleted.", type: "success" });
        await fetchHomestays(false);
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to delete review."),
          type: "error",
        });
      } finally {
        setDeletingReviewId("");
      }
    },
    [fetchHomestays]
  );

  const openCivicReview = useCallback((booking: Booking) => {
    setCivicReviewTarget(booking);
    setCivicReviewForm({
      rating: "5",
      comment: "",
      images: "",
    });
  }, []);

  const handleCivicReviewSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!civicReviewTarget?.user?.id) return;

      setSavingCivicReview(true);
      setToast(null);

      try {
        await createCivicReview({
          targetUserId: civicReviewTarget.user.id,
          rating: Number(civicReviewForm.rating),
          comment: civicReviewForm.comment.trim(),
          images: splitList(civicReviewForm.images),
        });
        setToast({
          message: "Guest civic review saved.",
          type: "success",
        });
        setCivicReviewTarget(null);
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to save civic review."),
          type: "error",
        });
      } finally {
        setSavingCivicReview(false);
      }
    },
    [civicReviewForm, civicReviewTarget]
  );

  const openDateAvailability = useCallback(
    (target: {
      homestayId: string;
      room: Homestay["rooms"][number];
      date: string;
      label: string;
      bookedRooms: number;
      currentAvailable: number;
      note?: string | null;
    }) => {
      setAvailabilityTarget(target);
      setAvailabilityForm({
        availableRooms: String(target.currentAvailable),
        note: target.note || "",
      });
    },
    []
  );

  const saveDateAvailability = useCallback(async () => {
    if (!availabilityTarget) return;

    const totalRooms = availabilityTarget.room.totalRooms ?? 0;
    const availableRooms = Number(availabilityForm.availableRooms);

    if (
      !Number.isInteger(availableRooms) ||
      availableRooms < availabilityTarget.bookedRooms ||
      availableRooms > totalRooms
    ) {
      setToast({
        message: `Availability must be between booked rooms (${availabilityTarget.bookedRooms}) and total rooms (${totalRooms}).`,
        type: "warning",
      });
      return;
    }

    setSavingDateAvailability(true);
    setToast(null);

    try {
      await updateRoomDateAvailability(
        availabilityTarget.homestayId,
        availabilityTarget.room.id,
        {
          date: availabilityTarget.date,
          availableRooms,
          note: availabilityForm.note.trim(),
        }
      );
      setToast({
        message: "Date availability updated.",
        type: "success",
      });
      setAvailabilityTarget(null);
      await fetchHomestays(false);
    } catch (error) {
      setToast({
        message: getApiErrorMessage(
          error,
          "Unable to update date availability."
        ),
        type: "error",
      });
    } finally {
      setSavingDateAvailability(false);
    }
  }, [availabilityForm, availabilityTarget, fetchHomestays]);

  return (
    <ProtectedRoute roles={["OWNER", "ADMIN"]}>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-8 dark:bg-gray-950 md:px-6">
        <div className="mx-auto max-w-7xl">
          {toast && (
            <div className="mb-5">
              <Toast message={toast.message} type={toast.type} />
            </div>
          )}

          <section className="mb-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
              <p className="text-sm font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                Owner Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-bold text-gray-950 dark:text-white md:text-4xl">
                Manage Homestays
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Create, update, and remove listings using live backend data.
              </p>
              <Button className="mt-6" onClick={openCreateForm}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={18} />
                  Create Homestay
                </span>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Listings
                  </p>
                  <Home size={20} className="text-green-700 dark:text-green-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">
                  {ownerHomestays.length}
                </p>
              </div>
              <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Combined nightly price
                </p>
                <p className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">
                  Rs {totalValue}
                </p>
              </div>
              <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900 sm:col-span-2 lg:col-span-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending booking requests
                </p>
                <p className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">
                  {pendingRequests}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                  Quick Stats
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Live performance metrics for your properties and booking pipeline.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.label}
                      </p>
                      <Icon
                        size={20}
                        className="text-green-700 dark:text-green-400"
                      />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-950 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900 lg:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                    Room Availability
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add or remove available rooms for bookings, renovation, maintenance, or manual holds.
                  </p>
                </div>
              </div>

              {ownerHomestays.length ? (
                <div className="mt-5 space-y-5">
                  {ownerHomestays.map((homestay) => (
                    <div
                      key={homestay.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
                        {homestay.name}
                      </h3>
                      {homestay.rooms.length ? (
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                          {homestay.rooms.map((room) => (
                            <div
                              key={room.id}
                              className="rounded-lg bg-stone-50 p-4 dark:bg-gray-950"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-semibold text-gray-950 dark:text-white">
                                    {room.roomType || "Room"}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Total inventory: {room.totalRooms ?? 0} rooms
                                  </p>
                                </div>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                                  Click a date to edit
                                </span>
                              </div>

                              <RoomAvailabilityCalendar
                                homestayId={homestay.id}
                                room={room}
                                onSelectDate={openDateAvailability}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          No room types added yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Add a property before managing room availability.
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
              <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                Recent Reviews
              </h2>
              {ownerStats.recentReviews.length ? (
                <div className="mt-5 space-y-3">
                  {ownerStats.recentReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-gray-950 dark:text-white">
                          {review.homestayName}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                          <Star size={14} />
                          {review.rating}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {review.comment || "No written review provided."}
                      </p>
                      {review.ownerReply ? (
                        <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
                          <strong>Your reply:</strong> {review.ownerReply}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows={2}
                            value={reviewReplies[review.id] || ""}
                            onChange={(event) =>
                              setReviewReplies((current) => ({
                                ...current,
                                [review.id]: event.target.value,
                              }))
                            }
                            placeholder="Reply as owner"
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
                          />
                          <Button
                            type="button"
                            className="px-3 py-2 text-sm"
                            disabled={replyingReviewId === review.id}
                            onClick={() => handleReviewReply(review.id)}
                          >
                            {replyingReviewId === review.id
                              ? "Replying..."
                              : "Reply"}
                          </Button>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-3 px-3 py-2 text-sm"
                        disabled={deletingReviewId === review.id}
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        {deletingReviewId === review.id
                          ? "Deleting..."
                          : "Delete Review"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No reviews yet.
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
              <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                Owner Actions
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button type="button" onClick={openCreateForm}>
                  <span className="inline-flex items-center gap-2">
                    <Plus size={17} />
                    Add Property
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchHomestays()}
                  disabled={loading}
                >
                  Refresh Data
                </Button>
              </div>
              <div className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Booking approvals
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  Pending requests can be approved or rejected from the Booking Requests section below.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                  Booking Requests
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Requests from guests for your listed homestays.
                </p>
              </div>
            </div>

            {bookingRequests.length ? (
              <div className="mt-5 space-y-3">
                {bookingRequests.map((booking) => (
                  <div
                    key={booking.id}
                    className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800 md:grid-cols-[1.2fr_1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold text-gray-950 dark:text-white">
                        {booking.homestay?.name || "Homestay"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Guest: {booking.user?.fullName || "Guest"}{" "}
                        {booking.user?.email ? `(${booking.user.email})` : ""}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>Room: {booking.room?.roomType || "Room"}</p>
                      <p>
                        {new Date(booking.checkIn).toLocaleDateString()} to{" "}
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </p>
                      <p>Guests: {booking.guests}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                        {booking.status}
                      </span>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        Rs {booking.totalPrice}
                      </p>
                      {booking.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className="px-3 py-2 text-sm"
                            disabled={updatingBookingId === booking.id}
                            onClick={() =>
                              handleBookingDecision(booking.id, "accept")
                            }
                          >
                            {updatingBookingId === booking.id
                              ? "Updating..."
                              : "Accept"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="px-3 py-2 text-sm"
                            disabled={updatingBookingId === booking.id}
                            onClick={() =>
                              handleBookingDecision(booking.id, "reject")
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                      {booking.user?.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3 py-2 text-sm"
                          onClick={() => openCivicReview(booking)}
                        >
                          Review Guest
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No booking requests yet.
              </div>
            )}
          </section>

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader size={52} />
            </div>
          ) : ownerHomestays.length === 0 ? (
            <section className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <Home className="mx-auto text-green-700 dark:text-green-400" size={42} />
              <h2 className="mt-4 text-2xl font-semibold text-gray-950 dark:text-white">
                No Homestays Yet
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Create your first listing and it will appear here automatically.
              </p>
              <Button className="mt-6" onClick={openCreateForm}>
                Create your first listing
              </Button>
            </section>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {ownerHomestays.map((homestay) => (
                <article
                  key={homestay.id}
                  className="group overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-green-100 dark:bg-gray-900 dark:ring-gray-800"
                >
                  <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {homestay.images?.[0] ? (
                      <img
                        src={homestay.images[0]}
                        alt={homestay.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <ImageIcon size={38} />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-950/80 dark:text-gray-200">
                      {homestay.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="line-clamp-2 text-xl font-semibold text-gray-950 dark:text-white">
                        {homestay.name}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={16} />
                        {homestay.location}
                      </p>
                    </div>

                    <p className="line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {homestay.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {homestay.amenities?.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-800 dark:bg-green-950 dark:text-green-300"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">
                        Rs {homestay.pricePerNight ?? 0}
                        <span className="text-sm font-normal text-gray-500"> / night</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(homestay)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          aria-label={`Edit ${homestay.name}`}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(homestay)}
                          className="rounded-lg border border-red-200 p-2 text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                          aria-label={`Delete ${homestay.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={isFormOpen}
        title={editingHomestay ? "Update Homestay" : "Create Homestay"}
        onClose={closeForm}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Name"
              value={form.name}
              error={formErrors.name}
              onChange={(value) => handleChange("name", value)}
            />
            <Field
              label="Location"
              value={form.location}
              error={formErrors.location}
              onChange={(value) => handleChange("location", value)}
            />
            <Field
              label="Price"
              type="number"
              value={form.pricePerNight}
              error={formErrors.pricePerNight}
              onChange={(value) => handleChange("pricePerNight", value)}
            />
            <Field
              label="Address"
              value={form.address}
              error={formErrors.address}
              onChange={(value) => handleChange("address", value)}
            />
            <Field
              label="Latitude"
              type="number"
              value={form.latitude}
              error={formErrors.latitude}
              onChange={(value) => handleChange("latitude", value)}
            />
            <Field
              label="Longitude"
              type="number"
              value={form.longitude}
              error={formErrors.longitude}
              onChange={(value) => handleChange("longitude", value)}
            />
          </div>

          <TextArea
            label="Description"
            value={form.description}
            error={formErrors.description}
            onChange={(value) => handleChange("description", value)}
          />

          <Field
            label="Images"
            placeholder="https://image-1.jpg, https://image-2.jpg"
            value={form.images}
            error={formErrors.images}
            onChange={(value) => handleChange("images", value)}
          />

          <Field
            label="Amenities"
            placeholder="WiFi, Parking, Mountain view"
            value={form.amenities}
            error={formErrors.amenities}
            onChange={(value) => handleChange("amenities", value)}
          />

          <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-950 dark:text-white">
                  Room Types
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add room inventory for booking availability.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addRoom}>
                Add Room
              </Button>
            </div>

            {formErrors.rooms ? (
              <p className="mt-3 text-sm text-red-600">{formErrors.rooms}</p>
            ) : null}

            <div className="mt-4 space-y-4">
              {form.rooms.map((room, index) => (
                <div
                  key={`${room.roomType}-${index}`}
                  className="rounded-lg bg-stone-50 p-4 dark:bg-gray-950"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium">Room {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeRoom(index)}
                      disabled={form.rooms.length === 1}
                      className="rounded-lg px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Room Type
                      </span>
                      <select
                        value={room.roomType}
                        onChange={(event) =>
                          handleRoomChange(index, "roomType", event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="STANDARD">STANDARD</option>
                        <option value="DELUXE">DELUXE</option>
                        <option value="FAMILY">FAMILY</option>
                        <option value="DORMITORY">DORMITORY</option>
                      </select>
                    </label>
                    <Field
                      label="Total Rooms"
                      type="number"
                      value={room.totalRooms}
                      onChange={(value) =>
                        handleRoomChange(index, "totalRooms", value)
                      }
                    />
                    <Field
                      label="Available Rooms"
                      type="number"
                      value={room.availableRooms}
                      onChange={(value) =>
                        handleRoomChange(index, "availableRooms", value)
                      }
                    />
                    <Field
                      label="Capacity"
                      type="number"
                      value={room.capacity}
                      onChange={(value) =>
                        handleRoomChange(index, "capacity", value)
                      }
                    />
                    <Field
                      label="Room Price"
                      type="number"
                      value={room.price}
                      onChange={(value) => handleRoomChange(index, "price", value)}
                    />
                    <div className="md:col-span-2">
                      <Field
                        label="Room Images"
                        placeholder="https://room-1.jpg, https://room-2.jpg"
                        value={room.images}
                        onChange={(value) =>
                          handleRoomChange(index, "images", value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingHomestay ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(civicReviewTarget)}
        title="Review Guest"
        onClose={() => {
          if (!savingCivicReview) setCivicReviewTarget(null);
        }}
      >
        {civicReviewTarget ? (
          <form className="space-y-4" onSubmit={handleCivicReviewSubmit}>
            <div className="rounded-lg bg-stone-50 p-4 dark:bg-gray-950">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Civic review for
              </p>
              <p className="mt-1 font-semibold text-gray-950 dark:text-white">
                {civicReviewTarget.user?.fullName || "Guest"}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {civicReviewTarget.user?.email}
              </p>
            </div>
            <Field
              label="Rating"
              type="number"
              value={civicReviewForm.rating}
              onChange={(value) =>
                setCivicReviewForm((current) => ({
                  ...current,
                  rating: value,
                }))
              }
            />
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Comment
              </span>
              <textarea
                rows={4}
                value={civicReviewForm.comment}
                onChange={(event) =>
                  setCivicReviewForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                required
              />
            </label>
            <Field
              label="Images"
              placeholder="https://image-1.jpg, https://image-2.jpg"
              value={civicReviewForm.images}
              onChange={(value) =>
                setCivicReviewForm((current) => ({
                  ...current,
                  images: value,
                }))
              }
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={savingCivicReview}
                onClick={() => setCivicReviewTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  savingCivicReview ||
                  civicReviewForm.comment.trim().length < 5
                }
              >
                {savingCivicReview ? "Saving..." : "Save Civic Review"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Delete Homestay"
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={deleting}
            onClick={confirmDelete}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(availabilityTarget)}
        title="Edit Date Availability"
        onClose={() => {
          if (!savingDateAvailability) setAvailabilityTarget(null);
        }}
      >
        {availabilityTarget ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-stone-50 p-4 dark:bg-gray-950">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {availabilityTarget.room.roomType || "Room"} on{" "}
                {availabilityTarget.label}
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Total rooms: {availabilityTarget.room.totalRooms ?? 0}
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Already booked: {availabilityTarget.bookedRooms}
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Bookable rooms for this date
              </span>
              <input
                type="number"
                min={availabilityTarget.bookedRooms}
                max={availabilityTarget.room.totalRooms ?? 0}
                value={availabilityForm.availableRooms}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    availableRooms: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-950 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This cannot be lower than existing bookings, so booked rooms are never removed.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Reason / note
              </span>
              <textarea
                rows={3}
                value={availabilityForm.note}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Renovation, maintenance, private hold..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-950 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </label>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={savingDateAvailability}
                onClick={() => setAvailabilityTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={savingDateAvailability}
                onClick={saveDateAvailability}
              >
                {savingDateAvailability ? "Saving..." : "Save Date"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </ProtectedRoute>
  );
}

type FieldProps = {
  label: string;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  error,
  type = "text",
  placeholder,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-green-950"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function TextArea({
  label,
  value,
  error,
  onChange,
}: Omit<FieldProps, "type" | "placeholder">) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <textarea
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-green-950"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function RoomAvailabilityCalendar({
  homestayId,
  room,
  onSelectDate,
}: {
  homestayId: string;
  room: Homestay["rooms"][number];
  onSelectDate: (target: {
    homestayId: string;
    room: Homestay["rooms"][number];
    date: string;
    label: string;
    bookedRooms: number;
    currentAvailable: number;
    note?: string | null;
  }) => void;
}) {
  const [baseDate] = useState(() => new Date().toISOString());
  const days = useMemo(() => {
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const booked =
        room.bookings?.filter((booking) => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          return (
            ["PENDING", "CONFIRMED"].includes(booking.status) &&
            checkIn <= date &&
            checkOut > date
          );
        }).length ?? 0;
      const override = room.availabilityOverrides?.find(
        (item) => item.date.slice(0, 10) === dateKey
      );
      const totalRooms = room.totalRooms ?? 0;
      const bookableRooms = override?.availableRooms ?? totalRooms;
      const available = Math.max(bookableRooms - booked, 0);
      const status =
        available === 0
          ? "Unavailable"
          : booked > 0
            ? "Partially Available"
            : "Available";

      return {
        key: dateKey,
        date: dateKey,
        label: date.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        }),
        available,
        booked,
        bookableRooms,
        note: override?.note,
        hasOverride: Boolean(override),
        status,
      };
    });
  }, [
    baseDate,
    room.availabilityOverrides,
    room.bookings,
    room.totalRooms,
  ]);

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-green-50 px-2 py-1 text-green-800 dark:bg-green-950 dark:text-green-200">
          Available
        </span>
        <span className="rounded-full bg-yellow-50 px-2 py-1 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          Partially Available
        </span>
        <span className="rounded-full bg-red-50 px-2 py-1 text-red-800 dark:bg-red-950 dark:text-red-200">
          Unavailable
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => (
          <button
            type="button"
            key={day.key}
            onClick={() =>
              onSelectDate({
                homestayId,
                room,
                date: day.date,
                label: day.label,
                bookedRooms: day.booked,
                currentAvailable: day.bookableRooms,
                note: day.note,
              })
            }
            className={`rounded-lg p-2 text-center text-xs ${
              day.status === "Unavailable"
                ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                : day.status === "Partially Available"
                  ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                  : "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
            } transition hover:ring-2 hover:ring-green-500 focus:outline-none focus:ring-2 focus:ring-green-500`}
          >
            <p className="font-semibold">{day.label}</p>
            <p>{day.available} left</p>
            {day.booked ? <p>{day.booked} booked</p> : null}
            {day.hasOverride ? <p className="mt-1 font-semibold">Edited</p> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
