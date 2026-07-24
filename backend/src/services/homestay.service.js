import prisma from "../config/prisma.js";

export async function getAllHomestays() {
  return prisma.homestay.findMany({
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          civicScore: true,
        },
      },
      rooms: {
        include: {
          bookings: {
            where: {
              status: {
                in: ["PENDING", "CONFIRMED"],
              },
            },
          },
          availabilityOverrides: true,
        },
      },
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
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          civicScore: true,
        },
      },
      rooms: {
        include: {
          bookings: {
            where: {
              status: {
                in: ["PENDING", "CONFIRMED"],
              },
            },
          },
          availabilityOverrides: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
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
  const { rooms = [], ...homestayData } = data;

  return prisma.homestay.create({
    data: {
      ...homestayData,
      rooms: {
        create: rooms.map((room) => ({
          roomType: room.roomType,
          totalRooms: Number(room.totalRooms),
          availableRooms: Number(room.availableRooms),
          capacity: Number(room.capacity),
          price: Number(room.price),
          images: room.images || [],
        })),
      },
    },
    include: {
      rooms: true,
      reviews: true,
    },
  });
}

export async function updateHomestay(id, data) {
  const { rooms, ...homestayData } = data;

  return prisma.$transaction(async (tx) => {
    let roomsToCreate = [];

    if (rooms) {
      const existingRooms = await tx.room.findMany({
        where: {
          homestayId: id,
        },
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      });
      const submittedRoomsWithIds = rooms.filter((room) => room.id);
      const submittedIds = new Set(submittedRoomsWithIds.map((room) => room.id));
      roomsToCreate = rooms.filter((room) => !room.id);

      await Promise.all(
        submittedRoomsWithIds.map((room) =>
          tx.room.update({
            where: {
              id: room.id,
            },
            data: {
              roomType: room.roomType,
              totalRooms: Number(room.totalRooms),
              availableRooms: Number(room.availableRooms),
              capacity: Number(room.capacity),
              price: Number(room.price),
              images: room.images || [],
            },
          })
        )
      );

      const removedRooms = existingRooms.filter(
        (room) => !submittedIds.has(room.id)
      );
      const removableRoomIds = removedRooms
        .filter((room) => room._count.bookings === 0)
        .map((room) => room.id);
      const retainedBookedRoomIds = removedRooms
        .filter((room) => room._count.bookings > 0)
        .map((room) => room.id);

      await tx.room.deleteMany({
        where: {
          id: {
            in: removableRoomIds,
          },
        },
      });

      if (retainedBookedRoomIds.length) {
        await tx.room.updateMany({
          where: {
            id: {
              in: retainedBookedRoomIds,
            },
          },
          data: {
            availableRooms: 0,
          },
        });
      }
    }

    return tx.homestay.update({
      where: {
        id,
      },
      data: {
        ...homestayData,
        ...(rooms
          ? {
              rooms: {
                create: roomsToCreate.map((room) => ({
                  roomType: room.roomType,
                  totalRooms: Number(room.totalRooms),
                  availableRooms: Number(room.availableRooms),
                  capacity: Number(room.capacity),
                  price: Number(room.price),
                  images: room.images || [],
                })),
              },
            }
          : {}),
      },
      include: {
        rooms: true,
        reviews: true,
      },
    });
  });
}

export async function deleteHomestay(id) {
  return prisma.homestay.delete({
    where: {
      id,
    },
  });
}

export async function updateRoomAvailability({
  user,
  homestayId,
  roomId,
  availableRooms,
}) {
  const homestay = await prisma.homestay.findUnique({
    where: {
      id: homestayId,
    },
    include: {
      rooms: true,
    },
  });

  if (!homestay) {
    const error = new Error("Homestay not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "ADMIN" && homestay.ownerId !== user.id) {
    const error = new Error("Only the owner can update room availability");
    error.statusCode = 403;
    throw error;
  }

  const room = homestay.rooms.find((item) => item.id === roomId);

  if (!room) {
    const error = new Error("Room not found for this homestay");
    error.statusCode = 404;
    throw error;
  }

  const nextAvailableRooms = Number(availableRooms);

  if (
    !Number.isInteger(nextAvailableRooms) ||
    nextAvailableRooms < 0 ||
    nextAvailableRooms > room.totalRooms
  ) {
    const error = new Error(
      `Available rooms must be between 0 and ${room.totalRooms}`
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      availableRooms: nextAvailableRooms,
    },
  });
}

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export async function updateRoomDateAvailability({
  user,
  homestayId,
  roomId,
  date,
  availableRooms,
  note,
}) {
  const normalizedDate = normalizeDate(date);
  const nextAvailableRooms = Number(availableRooms);

  const homestay = await prisma.homestay.findUnique({
    where: {
      id: homestayId,
    },
    include: {
      rooms: true,
    },
  });

  if (!homestay) {
    const error = new Error("Homestay not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "ADMIN" && homestay.ownerId !== user.id) {
    const error = new Error("Only the owner can update room availability");
    error.statusCode = 403;
    throw error;
  }

  const room = homestay.rooms.find((item) => item.id === roomId);

  if (!room) {
    const error = new Error("Room not found for this homestay");
    error.statusCode = 404;
    throw error;
  }

  if (
    Number.isNaN(normalizedDate.getTime()) ||
    !Number.isInteger(nextAvailableRooms) ||
    nextAvailableRooms < 0 ||
    nextAvailableRooms > room.totalRooms
  ) {
    const error = new Error(
      `Available rooms must be between 0 and ${room.totalRooms}`
    );
    error.statusCode = 400;
    throw error;
  }

  const nextDate = new Date(normalizedDate);
  nextDate.setDate(normalizedDate.getDate() + 1);
  const bookedRooms = await prisma.booking.count({
    where: {
      roomId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      checkIn: {
        lt: nextDate,
      },
      checkOut: {
        gt: normalizedDate,
      },
    },
  });

  if (nextAvailableRooms < bookedRooms) {
    const error = new Error(
      `This date already has ${bookedRooms} booked room(s). Availability cannot be lower than booked rooms.`
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.roomAvailabilityOverride.upsert({
    where: {
      roomId_date: {
        roomId,
        date: normalizedDate,
      },
    },
    create: {
      roomId,
      date: normalizedDate,
      availableRooms: nextAvailableRooms,
      note: note || null,
    },
    update: {
      availableRooms: nextAvailableRooms,
      note: note || null,
    },
  });
}
