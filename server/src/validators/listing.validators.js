import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(2000).optional().default(""),
  locationText: z.string().min(3).max(200),
  lat: z.number(),
  lng: z.number(),
  priceBase: z.number().min(1),
  maxGuests: z.number().min(1).max(50).optional().default(2),

  amenities: z.array(z.string()).optional().default([]),
  rules: z.array(z.string()).optional().default([]),
  ecoTags: z.array(z.string()).optional().default([]),

  safetyFeatures: z
    .object({
      cctv: z.boolean().optional(),
      guard: z.boolean().optional(),
      wellLit: z.boolean().optional(),
      emergencyContact: z.boolean().optional(),
      fireExtinguisher: z.boolean().optional(),
      firstAid: z.boolean().optional(),
    })
    .optional()
    .default({}),
});

export const updateListingSchema = createListingSchema.partial();