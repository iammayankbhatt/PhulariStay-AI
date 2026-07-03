import prisma from "../config/prisma.js";

export async function getAllHomestays() {
  return prisma.homestay.findMany({
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      rooms: true,
      reviews: true,
    },
  });
}

export async function getHomestayById(id) {
  return prisma.homestay.findUnique({
    where: {
      id,
    },
    include: {
      owner: true,
      rooms: true,
      reviews: true,
    },
  });
}

export async function searchHomestays(query) {
  return prisma.homestay.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
  });
}

export async function createHomestay(data) {
  return prisma.homestay.create({
    data,
  });
}

export async function updateHomestay(id, data) {
  return prisma.homestay.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteHomestay(id) {
  return prisma.homestay.delete({
    where: {
      id,
    },
  });
}