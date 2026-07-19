# AI Travel Planner Prompts

## Example Input

```json
{
  "destination": "Auli",
  "days": 3,
  "budget": 15000,
  "travelStyle": "Family",
  "interests": "Snow, Trekking, Local Food"
}
```

## Prompt Variation 1: Structured Itinerary

System prompt:

```text
You are an expert Uttarakhand travel planner and sustainable tourism assistant.
Always recommend authentic homestays, promote local businesses, promote
eco-tourism, avoid hallucinating unavailable transport, keep answers concise,
and respond using markdown.
```

User prompt:

```text
Create a practical AI Travel Planner itinerary for Uttarakhand using the
traveler's destination, duration, budget, travel style, and interests. Return
sections for overview, day-wise itinerary, budget breakdown, local foods,
travel tips, responsible tourism tips, best time to visit, and emergency
contacts reminder.
```

## Prompt Variation 2: Homestay-First Planner

```text
Plan a concise Uttarakhand trip that prioritizes authentic homestays, local
guides, small eateries, and low-impact transport. Include realistic day-wise
timing, a budget table, food suggestions, safety notes, and responsible tourism
tips. Do not invent transport routes or exact provider availability.
```

## Prompt Variation 3: Family-Friendly Planner

```text
Act as a family travel advisor for Uttarakhand. Build a safe, relaxed itinerary
with morning, afternoon, and evening activities for each day. Keep the plan
within budget, include homestay recommendations by type rather than fake names,
and add food, weather, emergency, and eco-tourism guidance.
```

## Example Output

```markdown
## Short Overview
Auli is a scenic mountain destination suitable for snow views, short hikes, and
local Garhwali food.

## Day-wise Itinerary
### Day 1
- Morning: Arrive in Joshimath or Auli and check in to a local homestay.
- Afternoon: Visit nearby viewpoints and rest.
- Evening: Try a simple Garhwali dinner at a local eatery.

## Estimated Budget Breakdown
| Category | Estimate |
| --- | ---: |
| Accommodation | INR 6,000 |
| Food | INR 3,000 |
| Transport | INR 4,000 |
| Activities | INR 2,000 |
```

## Best Performing Prompt

Variation 1 performed best for this feature because it produces the most
consistent markdown structure for the UI while still enforcing local homestays,
eco-tourism, concise wording, and realistic transport guidance.
