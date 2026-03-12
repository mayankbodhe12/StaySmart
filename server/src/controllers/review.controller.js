import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";
import { createNotification } from "../utils/notify.js";

export async function createReview(req, res, next) {
  try {
    const { bookingId, rating, comment = "" } = req.body;

    if (!bookingId || rating === undefined || rating === null) {
      return res
        .status(400)
        .json({ message: "bookingId and rating are required" });
    }

    const numericRating = Number(rating);

    if (
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.guestId) !== String(req.user.sub)) {
      return res
        .status(403)
        .json({ message: "You can review only your own booking" });
    }

    if (booking.status !== "confirmed") {
      return res
        .status(400)
        .json({ message: "Only confirmed bookings can be reviewed" });
    }

    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Review already submitted for this booking" });
    }

    const listing = await Listing.findById(booking.listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const review = await Review.create({
      listingId: booking.listingId,
      bookingId: booking._id,
      guestId: booking.guestId,
      hostId: booking.hostId,
      rating: numericRating,
      comment: String(comment).trim(),
    });

    await createNotification(req, {
      userId: booking.hostId,
      type: "review_created",
      title: "New review received",
      message: `You received a ${numericRating}-star review`,
      link: "/host/reviews",
      meta: {
        reviewId: review._id,
        listingId: booking.listingId,
      },
    });

    res.status(201).json({ review });
  } catch (e) {
    next(e);
  }
}

export async function getListingReviews(req, res, next) {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId).select("_id status");
    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    const reviews = await Review.find({ listingId })
      .populate("guestId", "name email")
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const avg =
      total > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total
        : 0;

    res.json({
      reviews,
      meta: {
        total,
        averageRating: Number(avg.toFixed(1)),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function replyToReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const { text = "" } = req.body;

    const cleanText = String(text).trim();
    if (!cleanText) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const isOwner = String(review.hostId) === String(req.user.sub);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You can reply only to your listing reviews" });
    }

    review.hostReply = {
      text: cleanText,
      repliedAt: new Date(),
    };

    await review.save();

    await createNotification(req, {
      userId: review.guestId,
      type: "review_reply",
      title: "Host replied to your review",
      message: review.hostReply.text.slice(0, 80),
      link: `/listing/${review.listingId}`,
      meta: {
        reviewId: review._id,
      },
    });

    res.json({
      message: "Reply saved successfully",
      review,
    });
  } catch (e) {
    next(e);
  }
}