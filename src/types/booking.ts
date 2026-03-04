export type BookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface Booking {
  id: string;
  location: string;
  vehicle_plate: string;
  notes: string | null;
  status: BookingStatus;
  scheduled_at: string;
  created_at: string;
  crew_id: string | null;
  seeker_id: string;
}
