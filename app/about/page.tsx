import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold text-green-700">
            About PhulariStay AI
          </h1>

          <p className="text-lg leading-8 text-gray-700">
            PhulariStay AI is a platform designed to promote homestays and
            eco-tourism in Uttarakhand. Our goal is to help travelers discover
            authentic local stays while empowering homestay owners with modern
            digital tools for property management, bookings, and guest
            engagement.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}