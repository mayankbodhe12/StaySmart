import { z } from "zod";

export const createBookingSchema = z.object({
  listingId: z.string().min(10),
  checkIn: z.string(),   // ISO date from client
  checkOut: z.string(),  // ISO date from client
  guests: z.number().min(1).max(50),
});