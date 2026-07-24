"use client";

import { Heart, MapPin, Star, BedDouble, BadgeCheck } from "lucide-react";

interface Room {
  id: string;
  price: number;
  availableRooms: number;
}

interface Review {
  id: string;
  rating: number;
}

interface Homestay {
  id: string;
  name: string;
  location: string;
  image?: string;
  images?: string[];
  isVerified: boolean;
  rooms: Room[];
  reviews: Review[];
}

export default function HomestayCard({ homestay }: { homestay: Homestay }) {
  const averageRating =
    homestay.reviews.length > 0
      ? (
          homestay.reviews.reduce((sum, r) => sum + r.rating, 0) /
          homestay.reviews.length
        ).toFixed(1)
      : "New";

  const lowestPrice =
    homestay.rooms.length > 0
      ? Math.min(...homestay.rooms.map((r) => r.price))
      : 0;

  const availableRooms = homestay.rooms.reduce(
    (sum, room) => sum + room.availableRooms,
    0
  );

  return (
    <div className="group overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-green-100 dark:bg-gray-900 dark:ring-gray-800 dark:hover:ring-green-900">
      <div className="relative">
        <img
          src={homestay.images?.[0] || homestay.image || "/window.svg"}
          alt={homestay.name}
          className="h-56 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-60"
        />

        <button className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur hover:bg-white dark:bg-black/50">
          <Heart size={20} />
        </button>

        {homestay.isVerified && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
            <BadgeCheck size={14} />
            Verified
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug">{homestay.name}</h3>

          <div className="flex items-center gap-1">
            <Star className="fill-yellow-400 text-yellow-400" size={18} />
            <span>{averageRating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MapPin size={17} />
          <span>{homestay.location}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <BedDouble size={17} />
          <span>{availableRooms} Rooms Available</span>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div>
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              ₹{lowestPrice}
            </span>

            <span className="text-gray-500"> / night</span>
          </div>

          <button className="rounded-lg bg-green-600 px-5 py-2 text-white transition hover:bg-green-700">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
