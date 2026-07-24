"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Home,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
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
  createHomestay,
  deleteHomestay,
  getHomestays,
  updateHomestay,
} from "@/services/homestay.service";
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
};

type FormErrors = Partial<Record<keyof FormState, string>>;

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
  };
}

export default function OwnerPage() {
  const { user } = useAuth();
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingHomestay, setEditingHomestay] = useState<Homestay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Homestay | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      const data = await getHomestays();
      setHomestays(data);
    } catch (error) {
      console.error(error);
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

  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    },
    []
  );

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
        console.error(error);
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
      console.error(error);
      setToast({
        message: getApiErrorMessage(error, "Unable to delete homestay."),
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchHomestays]);

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
            </div>
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
