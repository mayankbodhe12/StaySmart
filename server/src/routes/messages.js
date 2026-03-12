import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getBookingMessages,
  sendBookingMessage,
  markBookingMessagesRead,
  getBookingChatMeta,
} from "../controllers/message.controller.js";

const router = Router();

router.get("/booking/:bookingId", requireAuth, getBookingMessages);
router.post("/booking/:bookingId", requireAuth, sendBookingMessage);
router.post("/booking/:bookingId/read", requireAuth, markBookingMessagesRead);
router.get("/meta", requireAuth, getBookingChatMeta);

export default router;