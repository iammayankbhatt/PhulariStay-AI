import Loader from "@/components/ui/Loader";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-gray-950">
      <Loader size={52} />
    </main>
  );
}
