import api from "@/lib/api";

export type BookingPayload = {
  homestayId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type Booking = {
  id: string;
  homestayId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  homestay?: {
    id: string;
    name: string;
    location: string;
    images?: string[];
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  room?: {
    id: string;
    roomType: string;
    price: number;
  };
};

export async function createBooking(payload: BookingPayload): Promise<Booking> {
  const response = await api.post<{ success: boolean; booking: Booking }>(
    "/bookings",
    payload
  );
  return response.data.booking;
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await api.get<{ success: boolean; bookings: Booking[] }>(
    "/bookings"
  );
  return response.data.bookings;
}

export async function getOwnerBookingRequests(): Promise<Booking[]> {
  const response = await api.get<{ success: boolean; bookings: Booking[] }>(
    "/bookings/owner/requests"
  );
  return response.data.bookings;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const response = await api.patch<{ success: boolean; booking: Booking }>(
    `/bookings/${id}/cancel`
  );
  return response.data.booking;
}

export async function acceptBookingRequest(id: string): Promise<Booking> {
  const response = await api.patch<{ success: boolean; booking: Booking }>(
    `/bookings/${id}/accept`
  );
  return response.data.booking;
}

export async function rejectBookingRequest(id: string): Promise<Booking> {
  const response = await api.patch<{ success: boolean; booking: Booking }>(
    `/bookings/${id}/reject`
  );
  return response.data.booking;
}
