import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { getHostAnalytics } from "../controllers/host.controller.js";

const router = Router();

router.get(
  "/analytics",
  requireAuth,
  requireRole("host", "admin"),
  getHostAnalytics
);

export default router;