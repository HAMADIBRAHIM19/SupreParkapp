export type BookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface Booking {
  id: string;
  location: string;
  vehicle_plate: string;
  vehicle_name: string | null;
  contact_number: string | null;
  expected_arrival: string | null;
  notes: string | null;
  status: BookingStatus;
  scheduled_at: string;
  created_at: string;
  crew_id: string | null;
  seeker_id: string;
}
