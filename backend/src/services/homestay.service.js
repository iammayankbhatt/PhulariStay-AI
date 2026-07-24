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
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          civicScore: true,
        },
      },
      rooms: true,
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
