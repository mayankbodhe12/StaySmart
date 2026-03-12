import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { upload } from "../config/uploader.js";
import { uploadListingImages } from "../controllers/listingImages.controller.js";
import { searchListings } from "../controllers/listing.controller.js";

import {
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getListings,
  getListingById,
  getSimilarListings,
  getBlockedRanges,
  addBlockedRange,
  deleteBlockedRange,
} from "../controllers/listing.controller.js";
import { getPricePreview } from "../controllers/listing.controller.js";
import { getTrendingListings } from "../controllers/trending.controller.js";

const router = Router();

// -------- PUBLIC --------
router.get("/", getListings);

// -------- HOST --------
router.get(
  "/host/mine",
  requireAuth,
  requireRole("host", "admin"),
  getMyListings
);

router.post("/", requireAuth, requireRole("host", "admin"), createListing);

router.post(
  "/:id/images",
  requireAuth,
  requireRole("host", "admin"),
  upload.array("images", 10),
  uploadListingImages
);

router.get("/search", searchListings);

router.get("/price-preview", getPricePreview);

router.get("/trending", getTrendingListings);

router.get("/:id/similar", getSimilarListings);

router.get(
  "/:id/blocked-ranges",
  requireAuth,
  requireRole("host", "admin"),
  getBlockedRanges
);

router.post(
  "/:id/blocked-ranges",
  requireAuth,
  requireRole("host", "admin"),
  addBlockedRange
);

router.delete(
  "/:id/blocked-ranges/:rangeId",
  requireAuth,
  requireRole("host", "admin"),
  deleteBlockedRange
);

router.get("/:id", getListingById);

router.put("/:id", requireAuth, updateListing);

router.delete("/:id", requireAuth, deleteListing);

export default router;