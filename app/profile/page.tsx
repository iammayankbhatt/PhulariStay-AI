"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarCheck, Heart, Pencil, Sparkles, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api";
import {
  AuthUser,
  getCurrentUser,
  updateCurrentUser,
} from "@/services/auth.service";
import { Booking, getMyBookings } from "@/services/booking.service";

type ProfileForm = {
  name: string;
  avatar: string;
  coverImage: string;
  phone: string;
  address: string;
  emergencyContact: string;
  gender: string;
  dob: string;
  bio: string;
  preferredTravelStyle: string;
  favoriteDestinations: string;
};

const toForm = (user: AuthUser): ProfileForm => ({
  name: user.name || "",
  avatar: user.avatar || "",
  coverImage: user.coverImage || "",
  phone: user.phone || "",
  address: user.address || "",
  emergencyContact: user.emergencyContact || "",
  gender: user.gender || "",
  dob: user.dob ? user.dob.slice(0, 10) : "",
  bio: user.bio || "",
  preferredTravelStyle: user.preferredTravelStyle || "",
  favoriteDestinations: user.favoriteDestinations?.join(", ") || "",
});

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function ProfilePage() {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [currentUser, currentBookings] = await Promise.all([
        getCurrentUser(),
        getMyBookings(),
      ]);
      setProfile(currentUser);
      setForm(toForm(currentUser));
      setBookings(currentBookings);
    } catch (error) {
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

  const completion = useMemo(() => {
    if (!profile) return 0;

    const fields = [
      profile.name,
      profile.email,
      profile.avatar,
      profile.coverImage,
      profile.phone,
      profile.address,
      profile.emergencyContact,
      profile.gender,
      profile.dob,
      profile.bio,
      profile.preferredTravelStyle,
      profile.favoriteDestinations?.length ? "destinations" : "",
    ];

    return Math.round(
      (fields.filter(Boolean).length / fields.length) * 100
    );
  }, [profile]);

  const aiHistoryCount = useMemo(() => {
    if (typeof window === "undefined") return 0;

    try {
      const stored = localStorage.getItem("phularistay_ai_plan_history");
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form) return;

      if (form.name.trim().length < 2) {
        setToast({
          message: "Name must be at least 2 characters.",
          type: "warning",
        });
        return;
      }

      if (form.phone && form.phone.length < 8) {
        setToast({
          message: "Phone number looks too short.",
          type: "warning",
        });
        return;
      }

      setSaving(true);
      setToast(null);

      try {
        const updated = await updateCurrentUser({
          name: form.name.trim(),
          avatar: form.avatar.trim(),
          coverImage: form.coverImage.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          emergencyContact: form.emergencyContact.trim(),
          gender: form.gender,
          dob: form.dob,
          bio: form.bio.trim(),
          preferredTravelStyle: form.preferredTravelStyle,
          favoriteDestinations: splitList(form.favoriteDestinations),
        });

        setProfile(updated);
        setForm(toForm(updated));
        localStorage.setItem("phularistay_user", JSON.stringify(updated));
        setIsEditing(false);
        setToast({
          message: "Profile updated successfully.",
          type: "success",
        });
      } catch (error) {
        setToast({
          message: getApiErrorMessage(error, "Unable to update profile."),
          type: "error",
        });
      } finally {
        setSaving(false);
      }
    },
    [form]
  );

  const handleAvatarUpload = useCallback(
    (file: File | null) => {
      if (!file || !form) return;

      if (!file.type.startsWith("image/")) {
        setToast({
          message: "Please choose a valid image file.",
          type: "warning",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setForm((current) =>
          current ? { ...current, avatar: String(reader.result) } : current
        );
      };
      reader.readAsDataURL(file);
    },
    [form]
  );

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 py-8 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          {toast ? (
            <div className="mb-5">
              <Toast message={toast.message} type={toast.type} />
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader size={52} />
            </div>
          ) : error ? (
            <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
              <Toast message={error} type="error" />
              <Button className="mt-4" onClick={fetchProfile}>
                Retry
              </Button>
            </section>
          ) : profile ? (
            <>
              <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
                <div
                  className="h-44 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${
                      profile.coverImage || "/window.svg"
                    })`,
                  }}
                />
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="-mt-16 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-green-100 text-green-800 dark:border-gray-900 dark:bg-green-950 dark:text-green-300">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound size={44} />
                      )}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-950 dark:text-white">
                        {profile.name}
                      </h1>
                      <p className="mt-1 text-gray-500">{profile.email}</p>
                      <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-400">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setIsEditing(true)}>
                    <span className="inline-flex items-center gap-2">
                      <Pencil size={17} />
                      Edit Profile
                    </span>
                  </Button>
                </div>
              </section>

              <section className="mt-6 grid gap-4 md:grid-cols-4">
                <StatCard label="Profile Completion" value={`${completion}%`} />
                <StatCard label="Bookings" value={bookings.length} />
                <StatCard
                  label="Wishlist"
                  value={profile.favoriteDestinations?.length || 0}
                />
                <StatCard label="AI History" value={aiHistoryCount} />
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-3">
                <Panel title="Personal Details">
                  <Info label="Phone" value={profile.phone || "Not added"} />
                  <Info label="Address" value={profile.address || "Not added"} />
                  <Info
                    label="Emergency Contact"
                    value={profile.emergencyContact || "Not added"}
                  />
                  <Info label="Gender" value={profile.gender || "Not added"} />
                  <Info
                    label="DOB"
                    value={
                      profile.dob
                        ? new Date(profile.dob).toLocaleDateString()
                        : "Not added"
                    }
                  />
                </Panel>

                <Panel title="Travel Profile">
                  <Info
                    label="Preferred Travel Style"
                    value={profile.preferredTravelStyle || "Not added"}
                  />
                  <Info label="Bio" value={profile.bio || "Not added"} />
                  <Info
                    label="Favorite Destinations"
                    value={
                      profile.favoriteDestinations?.length
                        ? profile.favoriteDestinations.join(", ")
                        : "Not added"
                    }
                  />
                </Panel>

                <Panel title="Activity">
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <CalendarCheck size={18} />
                    Booking History: {bookings.length}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Heart size={18} />
                    Wishlist: {profile.favoriteDestinations?.length || 0}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Sparkles size={18} />
                    AI History: {aiHistoryCount}
                  </p>
                </Panel>
              </section>
            </>
          ) : null}
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={isEditing && Boolean(form)}
        title="Edit Profile"
        onClose={() => {
          if (!saving) setIsEditing(false);
        }}
      >
        {form ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <Field label="Avatar URL" value={form.avatar} onChange={(value) => setForm({ ...form, avatar: value })} />
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Upload Avatar
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleAvatarUpload(event.target.files?.[0] || null)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
                />
              </label>
              <Field label="Cover Image URL" value={form.coverImage} onChange={(value) => setForm({ ...form, coverImage: value })} />
              <Field label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
              <Field label="Emergency Contact" value={form.emergencyContact} onChange={(value) => setForm({ ...form, emergencyContact: value })} />
              <Field label="Gender" value={form.gender} onChange={(value) => setForm({ ...form, gender: value })} />
              <Field label="DOB" type="date" value={form.dob} onChange={(value) => setForm({ ...form, dob: value })} />
              <Field label="Preferred Travel Style" value={form.preferredTravelStyle} onChange={(value) => setForm({ ...form, preferredTravelStyle: value })} />
              <Field label="Favorite Destinations" value={form.favoriteDestinations} onChange={(value) => setForm({ ...form, favoriteDestinations: value })} />
            </div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Bio
              </span>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </ProtectedRoute>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
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
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950"
      />
    </label>
  );
}
