import prisma from "../config/prisma.js";

export async function createReview(userId, data) {
  const homestay = await prisma.homestay.findUnique({
    where: {
      id: data.homestayId,
    },
  });

  if (!homestay) {
    const error = new Error("Homestay not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.review.create({
    data: {
      userId,
      homestayId: data.homestayId,
      rating: Number(data.rating),
      comment: data.comment,
      images: data.images || [],
    },
  });
}
