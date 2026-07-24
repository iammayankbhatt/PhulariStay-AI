import api from "@/lib/api";

export type ReviewPayload = {
  homestayId: string;
  rating: number;
  comment: string;
  images: string[];
  visitDate: string;
};

export async function createReview(payload: ReviewPayload) {
  const response = await api.post("/reviews", payload);
  return response.data.review;
}

export async function updateReview(id: string, payload: ReviewPayload) {
  const response = await api.put(`/reviews/${id}`, payload);
  return response.data.review;
}

export async function deleteReview(id: string) {
  await api.delete(`/reviews/${id}`);
}

export async function markReviewHelpful(id: string) {
  const response = await api.patch(`/reviews/${id}/helpful`);
  return response.data.review;
}

export async function replyToReview(id: string, ownerReply: string) {
  const response = await api.patch(`/reviews/${id}/reply`, { ownerReply });
  return response.data.review;
}

export type CivicReviewPayload = {
  targetUserId: string;
  rating: number;
  comment: string;
  images: string[];
};

export async function createCivicReview(payload: CivicReviewPayload) {
  const response = await api.post("/reviews/civic", payload);
  return response.data.review;
}

export async function getCivicReviews(userId: string) {
  const response = await api.get(`/reviews/civic/${userId}`);
  return response.data.reviews;
}

export async function deleteCivicReview(id: string) {
  await api.delete(`/reviews/civic/${id}`);
}
