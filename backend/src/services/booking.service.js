import prisma from "../config/prisma.js";

const activeStatuses = ["PENDING", "CONFIRMED"];

const getNights = (checkIn, checkOut) =>
  Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

const validateDates = (checkIn, checkOut) => {
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    const error = new Error("Valid check-in and check-out dates are required");
    error.statusCode = 400;
    throw error;
  }

  if (checkOut <= checkIn) {
    const error = new Error("Check-out date must be after check-in date");
    error.statusCode = 400;
    throw error;
  }
};

const getStayDates = (checkIn, checkOut) => {
  const dates = [];
  const cursor = new Date(checkIn);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);

  while (cursor < end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const assertRoomAvailableForDates = async ({
  room,
  checkIn,
  checkOut,
  excludeBookingId,
}) => {
  const dates = getStayDates(checkIn, checkOut);

  for (const date of dates) {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const [bookedRooms, override] = await Promise.all([
      prisma.booking.count({
        where: {
          roomId: room.id,
          ...(excludeBookingId
            ? {
                id: {
                  not: excludeBookingId,
                },
              }
            : {}),
          status: {
            in: activeStatuses,
          },
          checkIn: {
            lt: nextDate,
          },
          checkOut: {
            gt: date,
          },
        },
      }),
      prisma.roomAvailabilityOverride.findUnique({
        where: {
          roomId_date: {
            roomId: room.id,
            date,
          },
        },
      }),
    ]);

    const bookableRooms = override?.availableRooms ?? room.totalRooms;

    if (bookedRooms >= bookableRooms) {
      const error = new Error(
        `Selected room type is not available on ${date.toLocaleDateString()}`
      );
      error.statusCode = 409;
      throw error;
    }
  }
};

export async function createBooking(userId, data) {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  validateDates(checkIn, checkOut);

  const room = await prisma.room.findFirst({
    where: {
      id: data.roomId,
      homestayId: data.homestayId,
    },
    include: {
      homestay: true,
    },
  });

  if (!room) {
    const error = new Error("Room type not found for this homestay");
    error.statusCode = 404;
    throw error;
  }

  await assertRoomAvailableForDates({ room, checkIn, checkOut });

  const guests = Number(data.guests);

  if (guests > room.capacity) {
    const error = new Error(`This room supports up to ${room.capacity} guest(s)`);
    error.statusCode = 400;
    throw error;
  }

  const nights = getNights(checkIn, checkOut);

  return prisma.booking.create({
    data: {
      userId,
      homestayId: data.homestayId,
      roomId: room.id,
      checkIn,
      checkOut,
      guests,
      totalPrice: nights * room.price,
      status: "PENDING",
    },
    include: {
      homestay: true,
      room: true,
    },
  });
}

export async function getBookingsForUser(userId) {
  return prisma.booking.findMany({
    where: {
      userId,
    },
    include: {
      homestay: true,
      room: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getBookingRequestsForOwner(user) {
  return prisma.booking.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            homestay: {
              ownerId: user.id,
            },
          },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      homestay: true,
      room: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getBookingByIdForUser(userId, id) {
  return prisma.booking.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      homestay: true,
      room: true,
    },
  });
}

export async function cancelBooking(userId, id) {
  const booking = await getBookingByIdForUser(userId, id);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === "CANCELLED") {
    return booking;
  }

  if (booking.status === "REJECTED") {
    const error = new Error("Rejected bookings cannot be cancelled");
    error.statusCode = 400;
    throw error;
  }

  return prisma.booking.update({
    where: {
      id,
    },
    data: {
      status: "CANCELLED",
    },
    include: {
      homestay: true,
      room: true,
    },
  });
}

const getBookingForOwnerAction = async (user, id) => {
  const booking = await prisma.booking.findFirst({
    where:
      user.role === "ADMIN"
        ? {
            id,
          }
        : {
            id,
            homestay: {
              ownerId: user.id,
            },
          },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      homestay: true,
      room: true,
    },
  });

  if (!booking) {
    const error = new Error("Booking request not found");
    error.statusCode = 404;
    throw error;
  }

  return booking;
};

export async function updateBookingRequestStatus(user, id, status) {
  const booking = await getBookingForOwnerAction(user, id);

  if (booking.status !== "PENDING") {
    const error = new Error("Only pending booking requests can be updated");
    error.statusCode = 400;
    throw error;
  }

  if (!["CONFIRMED", "REJECTED"].includes(status)) {
    const error = new Error("Booking status is invalid");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    if (status === "CONFIRMED") {
      const room = await tx.room.findUnique({
        where: {
          id: booking.roomId,
        },
      });

      if (!room) {
        const error = new Error("This room type is no longer available");
        error.statusCode = 409;
        throw error;
      }

      await assertRoomAvailableForDates({
        room,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        excludeBookingId: booking.id,
      });
    }

    return tx.booking.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        homestay: true,
        room: true,
      },
    });
  });
}
