import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env.js";
import prisma from "../config/prisma.js";
import { buildTravelPlanPrompt, SYSTEM_PROMPT } from "../utils/promptBuilder.js";

const model = "gemini-3.5-flash";

const findHomestaysNearDestination = async (destination) => {
  return prisma.homestay.findMany({
    where: {
      OR: [
        {
          location: {
            contains: destination,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: destination,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: destination,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      rooms: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: [
      {
        isVerified: "desc",
      },
      {
        pricePerNight: "asc",
      },
    ],
    take: 6,
  });
};

export const generateTravelPlan = async (preferences) => {
  if (!env.GEMINI_API_KEY) {
    const error = new Error("Gemini API key is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const homestays = await findHomestaysNearDestination(preferences.destination);

  const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model,
    contents: buildTravelPlanPrompt({
      ...preferences,
      homestays,
    }),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  const plan = response.text;

  if (!plan) {
    const error = new Error("Gemini did not return a travel plan.");
    error.statusCode = 502;
    throw error;
  }

  return plan;
};
