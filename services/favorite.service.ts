import api from "@/lib/api";
import { Homestay } from "@/types/homestay";

export type Favorite = {
  id: string;
  userId: string;
  homestayId: string;
  homestay: Homestay;
};

export async function getWishlist(): Promise<Favorite[]> {
  const response = await api.get<{ success: boolean; favorites: Favorite[] }>(
    "/favorites"
  );
  return response.data.favorites;
}

export async function addToWishlist(homestayId: string): Promise<Favorite> {
  const response = await api.post<{ success: boolean; favorite: Favorite }>(
    "/favorites",
    { homestayId }
  );
  return response.data.favorite;
}

export async function removeFromWishlist(homestayId: string): Promise<void> {
  await api.delete(`/favorites/${homestayId}`);
}
