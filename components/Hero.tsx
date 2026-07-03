export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn.trekthehimalayas.com/images/HomePageImages/Desktop/babe08cc-a807-452e-8754-8c33b7c6bb24_valley-of-flower%20(2).webp')",
        }}
      />

      {/* Dark Overlay for text contrast */}
      <div className="absolute inset-0 z-10 bg-black/50" />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 py-24 text-center text-white">
        <h1 className="mb-6 text-4xl font-bold md:text-6xl">
          Discover Authentic Homestays Across Uttarakhand
        </h1>

        <p className="mx-auto max-w-3xl text-lg md:text-xl text-white/90">
          Find, plan and experience local stays with AI-powered travel assistance.
        </p>

        <button className="mt-8 rounded-xl bg-stone-200 px-8 py-3 font-semibold text-green-700 shadow-lg transition hover:scale-105 hover:bg-gray-50 dark:bg-emerald-100 dark:text-green-900 dark:hover:bg-stone-200">
          Explore Homestays
        </button>
      </div>
    </section>
  );
}