export type BookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface Booking {
  id: string;
  location: string;
  vehicle_plate: string;
  vehicle_name: string | null;
  
  expected_arrival: string | null;
  notes: string | null;
  status: BookingStatus;
  scheduled_at: string;
  created_at: string;
  crew_id: string | null;
  seeker_id: string;
  crew_vehicle_name: string | null;
  crew_vehicle_plate: string | null;
  payment_status?: string;
  cancellation_reason?: string | null;
  cancellation_reason_note?: string | null;

}
