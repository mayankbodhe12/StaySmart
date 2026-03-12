import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import User from "../models/User.js";
import { becomeHost } from "../controllers/user.controller.js";

const router = Router();

/**
 * GET CURRENT USER
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select(
      "_id name email role createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * BECOME HOST
 */
router.post("/become-host", requireAuth, becomeHost);

export default router;