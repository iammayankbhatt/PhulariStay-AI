"use client";

import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clipboard,
  Download,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Trash2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";

import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api";
import { generateTravelPlan } from "@/services/ai.service";

const travelStyles = ["Solo", "Family", "Friends", "Couple", "Adventure"];
const HISTORY_KEY = "phularistay_ai_plan_history";

type TravelPlanForm = {
  from: string;
  destination: string;
  days: string;
  budget: string;
  travelStyle: string;
  interests: string;
};

type PlanHistoryItem = {
  id: string;
  title: string;
  destination: string;
  createdAt: string;
  prompt: TravelPlanForm;
  plan: string;
};

const initialForm: TravelPlanForm = {
  from: "",
  destination: "",
  days: "",
  budget: "",
  travelStyle: "Family",
  interests: "",
};

const readHistory = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? (JSON.parse(stored) as PlanHistoryItem[]) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history: PlanHistoryItem[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
};

export default function AiTravelPlannerPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary
        fallbackTitle="AI Planner paused"
        fallbackMessage="Something interrupted the planner UI. Try again and the rest of PhulariStay will keep working."
      >
        <AiPlannerContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

function AiPlannerContent() {
  const router = useRouter();
  const [form, setForm] = useState<TravelPlanForm>(initialForm);
  const [plan, setPlan] = useState("");
  const [history, setHistory] = useState<PlanHistoryItem[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHistory(readHistory());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const isFormIncomplete = useMemo(
    () =>
      !form.from.trim() ||
      !form.destination.trim() ||
      !form.days ||
      !form.budget ||
      !form.travelStyle ||
      !form.interests.trim(),
    [form]
  );

  const selectedTitle = useMemo(
    () =>
      form.destination.trim()
        ? `${form.from.trim() || "Trip"} to ${form.destination.trim()} ${
            form.days || "?"
          }-day plan`
        : "New travel plan",
    [form.days, form.destination, form.from]
  );

  const updateField = useCallback(
    (field: keyof TravelPlanForm, value: string) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    []
  );

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "error") => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), type === "success" ? 3200 : 4400);
    },
    []
  );

  const copyPlan = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plan);
      showToast("Travel plan copied to clipboard.", "success");
    } catch {
      showToast("Unable to copy the travel plan.");
    }
  }, [plan, showToast]);

  const downloadPdf = useCallback(() => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const text = plan.replace(/[#*_`|>-]/g, "");
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);

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
  }, [plan]);

  const addToHistory = useCallback((item: PlanHistoryItem) => {
    setHistory((current) => {
      const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(
        0,
        12
      );
      saveHistory(next);
      return next;
    });
  }, []);

  const selectHistory = useCallback((item: PlanHistoryItem) => {
    setForm({
      ...initialForm,
      ...item.prompt,
    });
    setPlan(item.plan);
    setHistoryOpen(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedHistoryIds([]);
    saveHistory([]);
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      saveHistory(next);
      return next;
    });
    setSelectedHistoryIds((current) => current.filter((itemId) => itemId !== id));
  }, []);

  const toggleHistorySelection = useCallback((id: string) => {
    setSelectedHistoryIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  }, []);

  const deleteSelectedHistory = useCallback(() => {
    if (!selectedHistoryIds.length) return;

    const selectedIds = new Set(selectedHistoryIds);
    setHistory((current) => {
      const next = current.filter((item) => !selectedIds.has(item.id));
      saveHistory(next);
      return next;
    });
    setSelectedHistoryIds([]);
  }, [selectedHistoryIds]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const days = Number(form.days);
      const budget = Number(form.budget);

      if (isFormIncomplete) {
        showToast("Please fill in every field before generating a plan.", "warning");
        return;
      }

      if (!Number.isInteger(days) || days < 1 || days > 30) {
        showToast("Duration must be a whole number between 1 and 30 days.");
        return;
      }

      if (!Number.isFinite(budget) || budget < 1000) {
        showToast("Budget must be at least 1000.");
        return;
      }

      setLoading(true);
      setPlan("");
      setToast(null);

      try {
        const nextPlan = await generateTravelPlan({
          from: form.from.trim(),
          destination: form.destination.trim(),
          days,
          budget,
          travelStyle: form.travelStyle,
          interests: form.interests.trim(),
        });

        const historyItem: PlanHistoryItem = {
          id: `${Date.now()}-${form.destination.trim()}`,
          title: selectedTitle,
          destination: form.destination.trim(),
          createdAt: new Date().toISOString(),
          prompt: {
            ...form,
            from: form.from.trim(),
            destination: form.destination.trim(),
            interests: form.interests.trim(),
          },
          plan: nextPlan,
        };

        setPlan(nextPlan);
        addToHistory(historyItem);
        showToast("Travel plan generated successfully.", "success");
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Unable to generate a travel plan."
        );

        if (message.toLowerCase().includes("unauthorized")) {
          showToast("Please log in to use the AI Travel Planner.");
          window.setTimeout(() => router.replace("/login"), 1200);
        } else {
          showToast(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      addToHistory,
      form,
      isFormIncomplete,
      router,
      selectedTitle,
      showToast,
    ]
  );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-stone-100 px-3 py-5 text-gray-950 dark:bg-gray-950 dark:text-gray-100 sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-5 flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-gray-900 dark:ring-gray-800 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                AI Travel Planner
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-gray-950 dark:text-white sm:text-3xl lg:text-4xl">
                Plan a smarter Uttarakhand trip
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                Generate a clear itinerary with local stays, budget notes,
                practical routing, and responsible travel suggestions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setHistoryOpen((current) => !current)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label={historyOpen ? "Hide plan history" : "Show plan history"}
              aria-expanded={historyOpen}
            >
              {historyOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              History
            </button>
          </header>

          {toast ? (
            <div className="mb-5" role="status" aria-live="polite">
              <Toast message={toast.message} type={toast.type} />
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(260px,320px)_minmax(360px,0.85fr)_minmax(0,1.3fr)]">
            {historyOpen ? (
              <HistorySidebar
                history={history}
                selectedIds={selectedHistoryIds}
                onSelect={selectHistory}
                onClear={clearHistory}
                onDelete={deleteHistoryItem}
                onToggleSelection={toggleHistorySelection}
                onDeleteSelected={deleteSelectedHistory}
              />
            ) : null}

            <PlannerForm
              form={form}
              loading={loading}
              isFormIncomplete={isFormIncomplete}
              onFieldChange={updateField}
              onSubmit={handleSubmit}
            />

            <PlanResult
              plan={plan}
              loading={loading}
              onCopy={copyPlan}
              onDownload={downloadPdf}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

const HistorySidebar = memo(function HistorySidebar({
  history,
  selectedIds,
  onSelect,
  onClear,
  onDelete,
  onToggleSelection,
  onDeleteSelected,
}: {
  history: PlanHistoryItem[];
  selectedIds: string[];
  onSelect: (item: PlanHistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onDeleteSelected: () => void;
}) {
  const selectedCount = selectedIds.length;

  return (
    <aside className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-gray-900 dark:ring-gray-800 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <History size={18} />
          History
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!history.length}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
          aria-label="Clear AI plan history"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {history.length ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-stone-50 p-2 dark:bg-gray-950">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={!selectedCount}
              className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:hover:bg-red-950"
            >
              Delete selected
            </button>
          </div>

        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-100 p-2 transition hover:border-green-200 hover:bg-green-50 dark:border-gray-800 dark:hover:border-green-900 dark:hover:bg-green-950"
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => onToggleSelection(item.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-2 focus:ring-green-600"
                  aria-label={`Select ${item.title} for deletion`}
                />
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <span className="line-clamp-2 text-sm font-semibold text-gray-950 dark:text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-300 dark:hover:bg-red-950"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
          <Sparkles className="mx-auto text-green-700 dark:text-green-400" size={28} />
          <p className="mt-3 text-sm font-medium">No saved plans yet</p>
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            Generated plans are stored locally in this browser.
          </p>
        </div>
      )}
    </aside>
  );
});

const PlannerForm = memo(function PlannerForm({
  form,
  loading,
  isFormIncomplete,
  onFieldChange,
  onSubmit,
}: {
  form: TravelPlanForm;
  loading: boolean;
  isFormIncomplete: boolean;
  onFieldChange: (field: keyof TravelPlanForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-gray-900 dark:ring-gray-800">
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field
          id="from"
          label="From"
          value={form.from}
          placeholder="Dehradun"
          onChange={(value) => onFieldChange("from", value)}
        />

        <Field
          id="destination"
          label="Destination"
          value={form.destination}
          placeholder="Auli"
          onChange={(value) => onFieldChange("destination", value)}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field
            id="days"
            label="Duration"
            type="number"
            min="1"
            max="30"
            value={form.days}
            placeholder="3"
            onChange={(value) => onFieldChange("days", value)}
          />
          <Field
            id="budget"
            label="Budget"
            type="number"
            min="1000"
            value={form.budget}
            placeholder="15000"
            onChange={(value) => onFieldChange("budget", value)}
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Travel Style
          </span>
          <select
            id="travelStyle"
            value={form.travelStyle}
            onChange={(event) => onFieldChange("travelStyle", event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-green-950"
          >
            {travelStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Interests
          </span>
          <textarea
            id="interests"
            rows={5}
            value={form.interests}
            onChange={(event) => onFieldChange("interests", event.target.value)}
            placeholder="Snow, trekking, local food"
            className="mt-2 min-h-32 w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-green-950"
          />
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-2 py-3"
        >
          <Sparkles size={18} />
          {loading ? "Generating..." : isFormIncomplete ? "Complete details" : "Generate plan"}
        </Button>
      </form>
    </section>
  );
});

function Field({
  id,
  label,
  value,
  placeholder,
  type = "text",
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-green-950"
      />
    </label>
  );
}

const PlanResult = memo(function PlanResult({
  plan,
  loading,
  onCopy,
  onDownload,
}: {
  plan: string;
  loading: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section
      className="min-w-0 rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-gray-900 dark:ring-gray-800 sm:p-5"
      aria-live="polite"
    >
      {loading ? (
        <PlanSkeleton />
      ) : plan ? (
        <div>
          <div className="mb-5 flex flex-col gap-3 border-b border-stone-200 pb-5 dark:border-gray-800 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCopy}
              className="flex min-h-11 items-center justify-center gap-2"
            >
              <Clipboard size={18} />
              Copy Response
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDownload}
              className="flex min-h-11 items-center justify-center gap-2"
            >
              <Download size={18} />
              Download PDF
            </Button>
          </div>

          <article className="prose-output max-h-[72vh] min-w-0 overflow-y-auto overflow-x-hidden pr-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-7 text-xl font-semibold text-green-800 dark:text-green-300 sm:text-2xl">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-5 text-lg font-semibold sm:text-xl">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 break-words leading-7 text-gray-700 dark:text-gray-200">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc space-y-2 pl-5 sm:pl-6">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal space-y-2 pl-5 sm:pl-6">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="break-words leading-7 text-gray-700 dark:text-gray-200">
                    {children}
                  </li>
                ),
                code: ({ children }) => (
                  <code className="break-words rounded bg-stone-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
                    {children}
                  </code>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src ?? ""}
                    alt={alt ?? ""}
                    loading="lazy"
                    decoding="async"
                    className="my-4 h-auto max-h-[420px] w-full rounded-lg object-cover"
                  />
                ),
                table: ({ children }) => (
                  <div className="mb-5 max-w-full overflow-x-auto rounded-lg border border-stone-200 dark:border-gray-700">
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
                  <td className="border-t border-stone-200 px-4 py-3 align-top dark:border-gray-700">
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
            Generate an itinerary with day-wise plans, local food, budget,
            best time to visit, and responsible travel tips.
          </p>
        </div>
      )}
    </section>
  );
});

const PlanSkeleton = memo(function PlanSkeleton() {
  return (
    <div className="min-h-[420px]" role="status" aria-label="Generating travel plan">
      <div className="mb-5 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
        Gemini is drafting your plan
        <span className="inline-flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-700 [animation-delay:-0.2s] dark:bg-green-400" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-700 [animation-delay:-0.1s] dark:bg-green-400" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-700 dark:bg-green-400" />
        </span>
      </div>

      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
        <div className="space-y-2">
          <div className="h-4 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
          <div className="h-4 w-8/12 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-lg bg-stone-200 dark:bg-gray-800" />
          <div className="h-28 animate-pulse rounded-lg bg-stone-200 dark:bg-gray-800" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-4 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
          <div className="h-4 w-9/12 animate-pulse rounded bg-stone-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
});
