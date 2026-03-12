import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  createBooking,
  myBookings,
  hostBookings,
  getGroupBooking,
  payGroupShare,
  checkListingAvailability,
  getListingBookedRanges,
} from "../controllers/booking.controller.js";

const router = Router();

// guest/customer bookings
router.post("/", requireAuth, createBooking);
router.get("/me", requireAuth, myBookings);

// host/admin bookings
router.get("/host", requireAuth, requireRole("host", "admin"), hostBookings);

// group booking flows
router.get("/group/:groupId", requireAuth, getGroupBooking);
router.post("/group/:groupId/pay", requireAuth, payGroupShare);

// public availability helpers
router.get("/availability", checkListingAvailability);
router.get("/listing/:listingId/ranges", getListingBookedRanges);

export default router;