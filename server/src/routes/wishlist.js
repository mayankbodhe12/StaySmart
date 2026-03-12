import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getMyWishlist,
  toggleWishlist,
  getWishlistStatus,
} from "../controllers/wishlist.controller.js";

const router = Router();

router.get("/", requireAuth, getMyWishlist);
router.post("/toggle", requireAuth, toggleWishlist);
router.get("/status/:listingId", requireAuth, getWishlistStatus);

export default router;