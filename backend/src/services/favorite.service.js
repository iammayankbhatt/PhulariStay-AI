import prisma from "../config/prisma.js";

export async function getWishlist(userId) {
  return prisma.favorite.findMany({
    where: {
      userId,
    },
    include: {
      homestay: {
        include: {
          rooms: true,
          reviews: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
}

export async function addToWishlist(userId, homestayId) {
  const homestay = await prisma.homestay.findUnique({
    where: {
      id: homestayId,
    },
  });

  if (!homestay) {
    const error = new Error("Homestay not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.favorite.upsert({
    where: {
      userId_homestayId: {
        userId,
        homestayId,
      },
    },
    create: {
      userId,
      homestayId,
    },
    update: {},
    include: {
      homestay: {
        include: {
          rooms: true,
          reviews: true,
        },
      },
    },
  });
}

export async function removeFromWishlist(userId, homestayId) {
  await prisma.favorite.deleteMany({
    where: {
      userId,
      homestayId,
    },
  });
}
