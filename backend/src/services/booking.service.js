import prisma from "../config/prisma.js";

export async function createBooking(userId, data) {
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

  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  if (checkOut <= checkIn) {
    const error = new Error("Check-out date must be after check-in date");
    error.statusCode = 400;
    throw error;
  }

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  return prisma.booking.create({
    data: {
      userId,
      homestayId: data.homestayId,
      checkIn,
      checkOut,
      guests: Number(data.guests),
      totalPrice: nights * homestay.pricePerNight,
    },
  });
}
