// backend/prisma/seed.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ----- Clear database (in correct order to avoid foreign key conflicts) -----
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.aIPlannerHistory.deleteMany();
  await prisma.homestay.deleteMany();
  await prisma.civicScore.deleteMany();
  await prisma.user.deleteMany();

  // ----- Create Owners -----
  const owner = await prisma.user.create({
    data: {
      fullName: "Rahul Bisht",
      email: "owner@PhulariStay.com",
      password: "123456",
      phone: "9999999999",
      role: "OWNER",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      fullName: "Anjali Rawat",
      email: "anjali@PhulariStay.com",
      password: "123456",
      phone: "8888888888",
      role: "OWNER",
    },
  });

  // ----- Create Admin -----
  await prisma.user.create({
    data: {
      fullName: "Admin",
      email: "admin@PhulariStay.com",
      password: "123456",
      phone: "7777777777",
      role: "ADMIN",
    },
  });

  // ----- Create Users -----
  const user1 = await prisma.user.create({
    data: {
      fullName: "Mayank Bhatt",
      email: "mayank@gmail.com",
      password: "123456",
      phone: "9876543210",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      fullName: "Priya Sharma",
      email: "priya@gmail.com",
      password: "123456",
      phone: "8765432109",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      fullName: "Amit Kumar",
      email: "amit@gmail.com",
      password: "123456",
      phone: "7654321098",
    },
  });

  // ----- Create Civic Scores for all users -----
  await prisma.civicScore.create({
    data: {
      userId: user1.id,
      score: 100,
    },
  });

  await prisma.civicScore.create({
    data: {
      userId: user2.id,
      score: 100,
    },
  });

  await prisma.civicScore.create({
    data: {
      userId: user3.id,
      score: 100,
    },
  });

  // (Owners and admin also get civic scores, but not required for seeding)

  // ----- Create Homestays -----

  // 1. Chopta View Homestay
  const chopta = await prisma.homestay.create({
    data: {
      ownerId: owner.id,
      name: "Chopta View Homestay",
      description: "Mountain view stay near Tungnath.",
      location: "Chopta",
      latitude: 30.489,
      longitude: 79.216,
      address: "Main Road Chopta",
      pricePerNight: 1800,
      images: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      ],
      amenities: ["WiFi", "Parking", "Breakfast"],
      isVerified: true,
    },
  });

  // 2. Auli Snow Retreat
  const auli = await prisma.homestay.create({
    data: {
      ownerId: owner.id,
      name: "Auli Snow Retreat",
      description: "Cosy homestay with panoramic Himalayan views.",
      location: "Auli",
      latitude: 30.529,
      longitude: 79.565,
      address: "Auli Village Road",
      pricePerNight: 2200,
      images: [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba",
      ],
      amenities: ["WiFi", "Heater", "Bonfire"],
      isVerified: true,
    },
  });

  // 3. Deoria Lake Camp
  const deoria = await prisma.homestay.create({
    data: {
      ownerId: owner2.id,
      name: "Deoria Lake Camp",
      description: "Riverside camping with lake views.",
      location: "Deoria",
      latitude: 30.436,
      longitude: 79.201,
      address: "Deoria Tal Road",
      pricePerNight: 1500,
      images: [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4",
      ],
      amenities: ["Campfire", "Trekking", "Parking"],
      isVerified: true,
    },
  });

  // 4. Kedar Valley Homestay
  const kedar = await prisma.homestay.create({
    data: {
      ownerId: owner2.id,
      name: "Kedar Valley Homestay",
      description: "Serene stay in the heart of Kedarnath valley.",
      location: "Kedar Valley",
      latitude: 30.735,
      longitude: 79.067,
      address: "Kedar Valley Road",
      pricePerNight: 2000,
      images: [
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      ],
      amenities: ["WiFi", "Room Service", "Mountain View"],
      isVerified: true,
    },
  });

  // 5. Tungnath Bliss
  const tungnath = await prisma.homestay.create({
    data: {
      ownerId: owner.id,
      name: "Tungnath Bliss",
      description: "Tranquil homestay at the base of Tungnath temple.",
      location: "Tungnath",
      latitude: 30.481,
      longitude: 79.221,
      address: "Tungnath Base Road",
      pricePerNight: 1900,
      images: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      ],
      amenities: ["WiFi", "Parking", "Organic Meals"],
      isVerified: true,
    },
  });

  // ----- Create Rooms for each Homestay -----

  // Chopta
  await prisma.room.create({
    data: {
      homestayId: chopta.id,
      roomType: "STANDARD",
      totalRooms: 8,
      availableRooms: 5,
      capacity: 2,
      price: 1800,
    },
  });
  await prisma.room.create({
    data: {
      homestayId: chopta.id,
      roomType: "DELUXE",
      totalRooms: 4,
      availableRooms: 2,
      capacity: 4,
      price: 2300,
    },
  });

  // Auli
  await prisma.room.create({
    data: {
      homestayId: auli.id,
      roomType: "STANDARD",
      totalRooms: 6,
      availableRooms: 4,
      capacity: 2,
      price: 2200,
    },
  });
  await prisma.room.create({
    data: {
      homestayId: auli.id,
      roomType: "DELUXE",
      totalRooms: 3,
      availableRooms: 1,
      capacity: 4,
      price: 2700,
    },
  });

  // Deoria
  await prisma.room.create({
    data: {
      homestayId: deoria.id,
      roomType: "STANDARD",
      totalRooms: 10,
      availableRooms: 7,
      capacity: 2,
      price: 1500,
    },
  });
  await prisma.room.create({
    data: {
      homestayId: deoria.id,
      roomType: "DELUXE",
      totalRooms: 5,
      availableRooms: 3,
      capacity: 4,
      price: 2000,
    },
  });

  // Kedar Valley
  await prisma.room.create({
    data: {
      homestayId: kedar.id,
      roomType: "STANDARD",
      totalRooms: 7,
      availableRooms: 5,
      capacity: 2,
      price: 2000,
    },
  });
  await prisma.room.create({
    data: {
      homestayId: kedar.id,
      roomType: "DELUXE",
      totalRooms: 3,
      availableRooms: 2,
      capacity: 4,
      price: 2500,
    },
  });

  // Tungnath
  await prisma.room.create({
    data: {
      homestayId: tungnath.id,
      roomType: "STANDARD",
      totalRooms: 8,
      availableRooms: 6,
      capacity: 2,
      price: 1900,
    },
  });
  await prisma.room.create({
    data: {
      homestayId: tungnath.id,
      roomType: "DELUXE",
      totalRooms: 4,
      availableRooms: 2,
      capacity: 4,
      price: 2400,
    },
  });

  // ----- Create Reviews (total 8) -----

  // Review 1: Chopta by user1
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Amazing mountain views!",
      images: [],
      userId: user1.id,
      homestayId: chopta.id,
    },
  });

  // Review 2: Chopta by user2
  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Good stay, comfortable rooms.",
      images: [],
      userId: user2.id,
      homestayId: chopta.id,
    },
  });

  // Review 3: Auli by user3
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Beautiful snow-capped peaks!",
      images: [],
      userId: user3.id,
      homestayId: auli.id,
    },
  });

  // Review 4: Auli by user1
  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Nice location, peaceful.",
      images: [],
      userId: user1.id,
      homestayId: auli.id,
    },
  });

  // Review 5: Deoria by user2
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Great trekking experience from the camp.",
      images: [],
      userId: user2.id,
      homestayId: deoria.id,
    },
  });

  // Review 6: Kedar Valley by user3
  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Peaceful valley, perfect for relaxation.",
      images: [],
      userId: user3.id,
      homestayId: kedar.id,
    },
  });

  // Review 7: Kedar Valley by user1
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Loved the hospitality and food.",
      images: [],
      userId: user1.id,
      homestayId: kedar.id,
    },
  });

  // Review 8: Tungnath by user2
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Excellent base for Tungnath trek.",
      images: [],
      userId: user2.id,
      homestayId: tungnath.id,
    },
  });

}

main()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
