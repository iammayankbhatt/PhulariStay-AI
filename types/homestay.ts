export interface Homestay {
  id: string;
  ownerId?: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  pricePerNight?: number;
  description: string;
  image?: string;
  images?: string[];
  amenities?: string[];
  isVerified: boolean;
  rooms: {
    id: string;
    roomType?: string;
    totalRooms?: number;
    capacity?: number;
    price: number;
    images?: string[];
    availableRooms: number;
    bookings?: {
      id: string;
      checkIn: string;
      checkOut: string;
      status: string;
    }[];
    availabilityOverrides?: {
      id: string;
      roomId: string;
      date: string;
      availableRooms: number;
      note?: string | null;
    }[];
  }[];
  reviews: {
    id: string;
    rating: number;
    comment?: string;
    images?: string[];
    visitDate?: string;
    helpfulCount?: number;
    ownerReply?: string | null;
    createdAt?: string;
    user?: {
      id: string;
      fullName: string;
    };
  }[];
  owner?: {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string | null;
    civicScore?: {
      score: number;
      totalReports: number;
    } | null;
  };
}

export type HomestayPayload = {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  address: string;
  pricePerNight: number;
  description: string;
  images: string[];
  amenities: string[];
  rooms: {
    id?: string;
    roomType: string;
    totalRooms: number;
    availableRooms: number;
    capacity: number;
    price: number;
    images: string[];
  }[];
};
