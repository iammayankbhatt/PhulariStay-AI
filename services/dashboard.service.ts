import { getCurrentUser } from "@/services/auth.service";
import { getHomestays } from "@/services/homestay.service";

export async function getDashboardData() {
  const [user, homestays] = await Promise.all([
    getCurrentUser(),
    getHomestays(),
  ]);

  return {
    user,
    homestays,
    savedTrips: [],
    recentActivity: [],
  };
}
