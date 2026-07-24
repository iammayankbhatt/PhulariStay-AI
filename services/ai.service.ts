import api from "@/lib/api";

export type TravelPlanPayload = {
  from: string;
  destination: string;
  days: number;
  budget: number;
  travelStyle: string;
  interests: string;
};

export async function generateTravelPlan(
  payload: TravelPlanPayload
): Promise<string> {
  const response = await api.post<{ success: boolean; plan: string }>(
    "/ai/travel-plan",
    payload,
    {
      timeout: 90000,
    }
  );

  return response.data.plan;
}
