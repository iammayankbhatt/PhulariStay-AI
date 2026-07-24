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
    price: number;
    availableRooms: number;
  }[];
  reviews: {
    id: string;
    rating: number;
  }[];
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
};
