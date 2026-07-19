export const SYSTEM_PROMPT = `
You are an expert Uttarakhand travel planner and sustainable tourism assistant.

Always:
- recommend authentic homestays
- recommend only homestays provided in the Available Homestays section
- promote local businesses
- promote eco-tourism
- avoid hallucinating unavailable transport
- keep answers concise
- respond using markdown
`;

const formatHomestay = (homestay, index) => {
  const amenities = homestay.amenities?.length
    ? homestay.amenities.join(", ")
    : "Amenities not listed";
  const rooms = homestay.rooms?.length
    ? homestay.rooms
        .map(
          (room) =>
            `${room.roomType} room, capacity ${room.capacity}, INR ${room.price}/night`
        )
        .join("; ")
    : "Room details not listed";
  const reviewCount = homestay.reviews?.length || 0;
  const averageRating = reviewCount
    ? (
        homestay.reviews.reduce((total, review) => total + review.rating, 0) /
        reviewCount
      ).toFixed(1)
    : "No reviews yet";

  return `${index + 1}. ${homestay.name}
- Location: ${homestay.location}
- Address: ${homestay.address}
- Base price: INR ${homestay.pricePerNight}/night
- Amenities: ${amenities}
- Rooms: ${rooms}
- Verified: ${homestay.isVerified ? "Yes" : "No"}
- Rating: ${averageRating}${reviewCount ? ` from ${reviewCount} review(s)` : ""}`;
};

export const formatAvailableHomestays = (homestays) => {
  if (!homestays.length) {
    return "No matching homestays were found in the database for this destination.";
  }

  return homestays.map(formatHomestay).join("\n\n");
};

export const buildTravelPlanPrompt = ({
  destination,
  days,
  budget,
  travelStyle,
  interests,
  homestays = [],
}) => `
Create a practical AI Travel Planner itinerary for Uttarakhand.

Traveler preferences:
- Destination: ${destination}
- Trip duration: ${days} day${Number(days) === 1 ? "" : "s"}
- Total budget: INR ${budget}
- Travel style: ${travelStyle}
- Interests: ${interests}

Available Homestays from PhulariStay AI database:
${formatAvailableHomestays(homestays)}

Homestay recommendation rules:
- Recommend ONLY the homestays listed above.
- If no matching homestays are listed, clearly say no database-matched homestay is available and suggest the user browse PhulariStay AI for nearby stays.
- Do not invent homestay names, prices, amenities, ratings, addresses, or availability.
- Explain why each recommended homestay fits the budget, travel style, or interests.

Return a beautiful markdown travel plan with these exact sections:

## Short Overview
## Day-wise Itinerary
Use Day 1, Day 2, etc. with Morning, Afternoon, and Evening.
## Estimated Budget Breakdown
Use a markdown table with Accommodation, Food, Transport, and Activities.
## Suggested Local Foods
## Travel Tips
## Responsible Tourism Tips
## Best Time to Visit
## Emergency Contacts Reminder

Keep recommendations realistic for Uttarakhand and prefer local homestays,
local guides, small eateries, and low-impact travel choices.
`;
