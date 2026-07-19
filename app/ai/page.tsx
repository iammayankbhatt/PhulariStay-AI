"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clipboard, Download, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Toast from "@/components/ui/Toast";

const travelStyles = ["Solo", "Family", "Friends", "Couple", "Adventure"];

type TravelPlanForm = {
  destination: string;
  days: string;
  budget: string;
  travelStyle: string;
  interests: string;
};

const initialForm: TravelPlanForm = {
  destination: "",
  days: "",
  budget: "",
  travelStyle: "Family",
  interests: "",
};

export default function AiTravelPlannerPage() {
  const [form, setForm] = useState<TravelPlanForm>(initialForm);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const isFormIncomplete = useMemo(
    () =>
      !form.destination.trim() ||
      !form.days ||
      !form.budget ||
      !form.travelStyle ||
      !form.interests.trim(),
    [form]
  );

  const updateField = (field: keyof TravelPlanForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const showError = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  };

  const showSuccess = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(plan);
      showSuccess("Travel plan copied to clipboard.");
    } catch {
      showError("Unable to copy the travel plan.");
    }
  };

  const downloadPdf = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const lines = doc.splitTextToSize(plan.replace(/[#*_`|>-]/g, ""), pageWidth - margin * 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PhulariStay AI Travel Plan", margin, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    let y = margin + 34;

    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(line, margin, y);
      y += 16;
    });

    doc.save("phularistay-ai-travel-plan.pdf");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const days = Number(form.days);
    const budget = Number(form.budget);

    if (isFormIncomplete) {
      showError("Please fill in every field before generating a plan.");
      return;
    }

    if (!Number.isInteger(days) || days < 1 || days > 30) {
      showError("Duration must be a whole number between 1 and 30 days.");
      return;
    }

    if (!Number.isFinite(budget) || budget < 1000) {
      showError("Budget must be at least 1000.");
      return;
    }

    setLoading(true);
    setPlan("");

    try {
      const response = await fetch("http://localhost:5000/api/ai/travel-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: form.destination.trim(),
          days,
          budget,
          travelStyle: form.travelStyle,
          interests: form.interests.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to generate a travel plan.");
      }

      setPlan(data.plan);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-stone-100 px-4 py-10 text-gray-950 dark:bg-gray-950 dark:text-gray-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                AI Travel Planner
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">
                Plan a smarter Uttarakhand trip
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Share your route, budget, style, and interests to get a concise
                itinerary with homestay-friendly, local-first suggestions.
              </p>
            </div>

            {toast ? (
              <div className="mb-5">
                <Toast
                  message={toast}
                  type={toast.includes("copied") ? "success" : "error"}
                />
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="font-medium" htmlFor="destination">
                  Destination
                </label>
                <input
                  id="destination"
                  value={form.destination}
                  onChange={(event) =>
                    updateField("destination", event.target.value)
                  }
                  placeholder="Auli"
                  className="rounded-lg border border-stone-300 bg-white p-3 outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-950"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="font-medium" htmlFor="days">
                    Duration
                  </label>
                  <input
                    id="days"
                    type="number"
                    min="1"
                    max="30"
                    value={form.days}
                    onChange={(event) => updateField("days", event.target.value)}
                    placeholder="3"
                    className="rounded-lg border border-stone-300 bg-white p-3 outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-950"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium" htmlFor="budget">
                    Budget
                  </label>
                  <input
                    id="budget"
                    type="number"
                    min="1000"
                    value={form.budget}
                    onChange={(event) =>
                      updateField("budget", event.target.value)
                    }
                    placeholder="15000"
                    className="rounded-lg border border-stone-300 bg-white p-3 outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-950"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium" htmlFor="travelStyle">
                  Travel Style
                </label>
                <select
                  id="travelStyle"
                  value={form.travelStyle}
                  onChange={(event) =>
                    updateField("travelStyle", event.target.value)
                  }
                  className="rounded-lg border border-stone-300 bg-white p-3 outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-950"
                >
                  {travelStyles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium" htmlFor="interests">
                  Interests
                </label>
                <textarea
                  id="interests"
                  rows={5}
                  value={form.interests}
                  onChange={(event) =>
                    updateField("interests", event.target.value)
                  }
                  placeholder="Snow, Trekking, Local Food"
                  className="resize-none rounded-lg border border-stone-300 bg-white p-3 outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-950"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <>
                    <Loader size={20} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate AI Travel Plan
                  </>
                )}
              </Button>
            </form>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {loading ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                <Loader size={56} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Building your itinerary with Gemini...
                </p>
              </div>
            ) : plan ? (
              <div>
                <div className="mb-5 flex flex-col gap-3 border-b border-stone-200 pb-5 dark:border-gray-800 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyPlan}
                    className="flex items-center justify-center gap-2"
                  >
                    <Clipboard size={18} />
                    Copy Plan
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={downloadPdf}
                    className="flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download PDF
                  </Button>
                </div>

                <article className="max-h-[690px] overflow-y-auto pr-1">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-4 text-3xl font-bold">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-3 mt-7 text-2xl font-semibold text-green-800 dark:text-green-300">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 mt-5 text-xl font-semibold">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 leading-7 text-gray-700 dark:text-gray-200">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 list-disc space-y-2 pl-6">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 list-decimal space-y-2 pl-6">
                          {children}
                        </ol>
                      ),
                      table: ({ children }) => (
                        <div className="mb-5 overflow-x-auto rounded-lg border border-stone-200 dark:border-gray-700">
                          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-stone-100 px-4 py-3 font-semibold dark:bg-gray-800">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border-t border-stone-200 px-4 py-3 dark:border-gray-700">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {plan}
                  </ReactMarkdown>
                </article>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col justify-center rounded-lg border border-dashed border-stone-300 p-6 text-center dark:border-gray-700">
                <Sparkles
                  size={42}
                  className="mx-auto mb-4 text-green-700 dark:text-green-400"
                />
                <h2 className="text-2xl font-semibold">
                  Your travel plan will appear here
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Generate an itinerary with day-wise plans, local foods,
                  budget, best time to visit, and responsible travel tips.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
