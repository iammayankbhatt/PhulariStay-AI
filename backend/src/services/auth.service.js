import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { signToken } from "../utils/jwt.js";
import { toSafeUser } from "../utils/userDto.js";

const SALT_ROUNDS = 12;
const ALLOWED_REGISTRATION_ROLES = ["USER", "OWNER"];

export async function register({ name, email, password, role = "USER" }) {
  const normalizedEmail = email.toLowerCase();

  if (!ALLOWED_REGISTRATION_ROLES.includes(role)) {
    const error = new Error("Role must be USER or OWNER");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName: name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    },
  });

  return {
    token: signToken(user),
    user: toSafeUser(user),
  };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: signToken(user),
    user: toSafeUser(user),
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return toSafeUser(user);
}

export async function updateCurrentUser(userId, data) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      fullName: data.name,
      phone: data.phone || null,
      profileImage: data.avatar || null,
      coverImage: data.coverImage || null,
      address: data.address || null,
      emergencyContact: data.emergencyContact || null,
      gender: data.gender || null,
      dob: data.dob ? new Date(data.dob) : null,
      bio: data.bio || null,
      preferredTravelStyle: data.preferredTravelStyle || null,
      favoriteDestinations: data.favoriteDestinations || [],
    },
  });

  return toSafeUser(user);
}

export async function findOrCreateGoogleUser(profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();

  if (!email) {
    const error = new Error("Google account email is required");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  const randomPassword = await bcrypt.hash(
    `${profile.id}:${Date.now()}`,
    SALT_ROUNDS
  );

  return prisma.user.create({
    data: {
      fullName: profile.displayName || email.split("@")[0],
      email,
      password: randomPassword,
      profileImage: profile.photos?.[0]?.value,
      role: "USER",
    },
  });
}
