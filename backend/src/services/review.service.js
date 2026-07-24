import prisma from "../config/prisma.js";

const includeReviewUser = {
  user: {
    select: {
      id: true,
      fullName: true,
    },
  },
};

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

  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      homestayId: data.homestayId,
    },
  });

  if (existingReview) {
    const error = new Error("You have already reviewed this stay");
    error.statusCode = 409;
    throw error;
  }

  return prisma.review.create({
    data: {
      userId,
      homestayId: data.homestayId,
      rating: Number(data.rating),
      comment: data.comment,
      images: data.images || [],
      visitDate: new Date(data.visitDate),
    },
    include: includeReviewUser,
  });
}

export async function updateReview(user, id, data) {
  const review = await prisma.review.findUnique({
    where: {
      id,
    },
  });

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "ADMIN" && review.userId !== user.id) {
    const error = new Error("Only the review author can edit this review");
    error.statusCode = 403;
    throw error;
  }

  return prisma.review.update({
    where: {
      id,
    },
    data: {
      rating: Number(data.rating),
      comment: data.comment,
      images: data.images || [],
      visitDate: new Date(data.visitDate),
    },
    include: includeReviewUser,
  });
}

export async function deleteReview(user, id) {
  const review = await prisma.review.findUnique({
    where: {
      id,
    },
    include: {
      homestay: true,
    },
  });

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    user.role !== "ADMIN" &&
    review.userId !== user.id &&
    review.homestay.ownerId !== user.id
  ) {
    const error = new Error("Only the author or homestay owner can delete this review");
    error.statusCode = 403;
    throw error;
  }

  await prisma.review.delete({
    where: {
      id,
    },
  });
}

export async function markHelpful(id) {
  return prisma.review.update({
    where: {
      id,
    },
    data: {
      helpfulCount: {
        increment: 1,
      },
    },
  });
}

export async function replyToReview(user, id, ownerReply) {
  const review = await prisma.review.findUnique({
    where: {
      id,
    },
    include: {
      homestay: true,
    },
  });

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "ADMIN" && review.homestay.ownerId !== user.id) {
    const error = new Error("Only the owner can reply to this review");
    error.statusCode = 403;
    throw error;
  }

  return prisma.review.update({
    where: {
      id,
    },
    data: {
      ownerReply,
    },
  });
}

const refreshCivicScore = async (targetUserId) => {
  const reviews = await prisma.civicReview.findMany({
    where: {
      targetUserId,
    },
  });
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 5;

  return prisma.civicScore.upsert({
    where: {
      userId: targetUserId,
    },
    create: {
      userId: targetUserId,
      score: Math.round(averageRating * 20),
      totalReports: reviews.length,
    },
    update: {
      score: Math.round(averageRating * 20),
      totalReports: reviews.length,
    },
  });
};

export async function createCivicReview(reviewerId, data) {
  if (reviewerId === data.targetUserId) {
    const error = new Error("You cannot review yourself");
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: data.targetUserId,
    },
  });

  if (!targetUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const review = await prisma.civicReview.upsert({
    where: {
      reviewerId_targetUserId: {
        reviewerId,
        targetUserId: data.targetUserId,
      },
    },
    create: {
      reviewerId,
      targetUserId: data.targetUserId,
      rating: Number(data.rating),
      comment: data.comment,
      images: data.images || [],
    },
    update: {
      rating: Number(data.rating),
      comment: data.comment,
      images: data.images || [],
    },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          fullName: true,
          civicScore: true,
        },
      },
    },
  });

  await refreshCivicScore(data.targetUserId);
  return review;
}

export async function getCivicReviews(targetUserId) {
  return prisma.civicReview.findMany({
    where: {
      targetUserId,
    },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function deleteCivicReview(user, id) {
  const review = await prisma.civicReview.findUnique({
    where: {
      id,
    },
  });

  if (!review) {
    const error = new Error("Civic review not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "ADMIN" && review.reviewerId !== user.id) {
    const error = new Error("Only the review author can delete this civic review");
    error.statusCode = 403;
    throw error;
  }

  await prisma.civicReview.delete({
    where: {
      id,
    },
  });
  await refreshCivicScore(review.targetUserId);
}
