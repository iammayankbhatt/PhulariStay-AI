import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const stats = [
    {
      title: "Bookings",
      value: "24",
    },
    {
      title: "Properties",
      value: "8",
    },
    {
      title: "Reviews",
      value: "4.8★",
    },
    {
      title: "AI Plans",
      value: "12",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-stone-100 px-4 py-4 md:px-6 md:py-8 transition-colors duration-200 dark:bg-gray-950">
        
        <div className="mx-auto max-w-7xl">

          {/* Heading */}
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-green-700 dark:text-green-400">
              Dashboard
            </h1>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage bookings, properties and travel plans.
            </p>
          </div>

          {/* Stats Grid */}
          <section className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-xl bg-stone-200 p-3 md:p-4 shadow-sm transition hover:shadow-md dark:bg-gray-900"
              >
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {item.title}
                </p>

                <h2 className="mt-1 text-xl md:text-2xl font-bold">
                  {item.value}
                </h2>
              </div>
            ))}
          </section>


              {/* Map Preview Section */}
          <section className="mb-10">
            <div className="overflow-hidden rounded-2xl bg-stone-200 shadow-md dark:bg-gray-900">
              
              <div className="border-b p-4 md:p-6 dark:border-gray-700">
                <h2 className="text-2xl font-semibold">
                  Nearby Homestays
                </h2>

                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Discover available homestays across Uttarakhand.
                </p>
              </div>

              {/* Map Placeholder */}
              <div className="relative flex h-48 md:h-72 items-center justify-center bg-gradient-to-br from-green-200 to-emerald-100 dark:from-green-950 dark:to-gray-950">
                
                <div className="absolute inset-0 opacity-20">
                  <div className="h-full w-full bg-[radial-gradient(circle,_gray_1px,_transparent_1px)] bg-[size:30px_30px]" />
                </div>

                <div className="z-10 text-center">
                  <div className="mb-4 text-5xl">
                    🗺️
                  </div>

                  <h3 className="text-xl font-bold">
                    Interactive Map Coming Soon
                  </h3>

                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Search homestays by location and explore nearby attractions.
                  </p>

                  <button className="mt-5 rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800">
                    Explore Locations
                  </button>
                </div>
              </div>

              {/* Sample Homestays */}
              <div className="grid gap-3 p-4 md:p-6 md:grid-cols-2 lg:grid-cols-4">

                {[
                  "Chopta View Stay",
                  "Tungnath Eco Lodge"
                ].map((stay) => (
                  <div
                    key={stay}
                    className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <p className="font-medium">
                      📍 {stay}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Uttarakhand
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>



          {/* Main Layout */}
          <section className="grid gap-6 lg:grid-cols-3">

            {/* Recent Bookings */}
            <div className="rounded-2xl bg-stone-200 p-4 md:p-6 shadow-md dark:bg-gray-900 lg:col-span-2">
              <h2 className="mb-4 text-2xl font-semibold">
                Recent Bookings
              </h2>

              <div className="space-y-4">

                {[
                  "Chopta Eco Stay",
                  "Tungnath View Homestay"
                ].map((booking) => (
                  <div
                    key={booking}
                    className="flex items-center justify-between rounded-xl border p-4 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-medium">
                        {booking}
                      </p>

                      <p className="text-sm text-gray-500">
                        Upcoming Trip
                      </p>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div cclassName="rounded-2xl bg-stone-200 p-4 md:p-6 shadow-md dark:bg-gray-900">
              <h2 className="mb-4 text-2xl font-semibold">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <button className="w-full rounded-lg bg-green-700 px-4 py-3 text-white hover:bg-green-800">
                  Book Homestay
                </button>

                <button className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white hover:bg-gray-800">
                  AI Route Planner
                </button>

                <button className="w-full rounded-lg border px-4 py-3 dark:border-gray-700 hover:bg-gray-400">
                  View Reviews
                </button>
              </div>
            </div>

          </section>

        </div>

      </main>

      <Footer />
    </>
  );
}