import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getHostReviewsDashboard } from "../controllers/hostReview.controller.js";

const router = Router();

router.get("/dashboard", requireAuth, getHostReviewsDashboard);

export default router;