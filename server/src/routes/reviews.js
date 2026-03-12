import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  createReview,
  getListingReviews,
  replyToReview,
} from "../controllers/review.controller.js";

const router = Router();

router.post("/", requireAuth, createReview);
router.get("/listing/:listingId", getListingReviews);
router.put("/:reviewId/reply", requireAuth, requireRole("host", "admin"), replyToReview);

export default router;