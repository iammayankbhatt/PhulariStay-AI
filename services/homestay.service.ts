import api from "@/lib/api";
import { Homestay, HomestayPayload } from "@/types/homestay";

export async function getHomestays(): Promise<Homestay[]> {
  const response = await api.get("/homestays");
  return response.data;
}

export async function getHomestay(id: string): Promise<Homestay> {
  const response = await api.get(`/homestays/${id}`);
  return response.data;
}

export async function createHomestay(
  payload: HomestayPayload
): Promise<Homestay> {
  const response = await api.post("/homestays", payload);
  return response.data;
}

export async function updateHomestay(
  id: string,
  payload: HomestayPayload
): Promise<Homestay> {
  const response = await api.put(`/homestays/${id}`, payload);
  return response.data;
}

export async function deleteHomestay(id: string): Promise<void> {
  await api.delete(`/homestays/${id}`);
}
