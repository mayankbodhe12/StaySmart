import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", requireAuth, getMyNotifications);
router.post("/:notificationId/read", requireAuth, markNotificationRead);
router.post("/read-all", requireAuth, markAllNotificationsRead);

export default router;