import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import hostRoutes from "./routes/host.js";
import reviewRoutes from "./routes/reviews.js";
import hostReviewRoutes from "./routes/hostReviews.js";
import wishlistRoutes from "./routes/wishlist.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";


const app = express();

app.use(helmet());
app.use(morgan("dev"));

// CORS must be BEFORE routes
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// IMPORTANT: no app.options wildcard in your setup

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/health", (req, res) =>
  res.json({ ok: true, message: "Server running ✅" })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/host-reviews", hostReviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);



app.use(notFound);
app.use(errorHandler);

export default app;