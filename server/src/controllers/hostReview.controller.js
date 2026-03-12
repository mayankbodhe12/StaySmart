import Review from "../models/Review.js";
import Listing from "../models/Listing.js";

export async function getHostReviewsDashboard(req, res, next) {
  try {
    const hostId = req.user.sub;

    const listings = await Listing.find({ hostId }).select("_id title locationText");
    const listingIds = listings.map((l) => l._id);

    const reviews = await Review.find({
      listingId: { $in: listingIds },
    })
      .populate("guestId", "name email")
      .populate("listingId", "title locationText")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    for (const r of reviews) {
      const key = String(r.rating);
      if (breakdown[key] !== undefined) breakdown[key]++;
    }

    const listingMap = new Map();

    for (const l of listings) {
      listingMap.set(String(l._id), {
        listingId: l._id,
        title: l.title,
        locationText: l.locationText,
        totalReviews: 0,
        averageRating: 0,
        ratingsSum: 0,
      });
    }

    for (const r of reviews) {
      const key = String(r.listingId?._id || r.listingId);
      const entry = listingMap.get(key);
      if (entry) {
        entry.totalReviews += 1;
        entry.ratingsSum += Number(r.rating || 0);
      }
    }

    const listingSummary = Array.from(listingMap.values()).map((item) => ({
      listingId: item.listingId,
      title: item.title,
      locationText: item.locationText,
      totalReviews: item.totalReviews,
      averageRating:
        item.totalReviews > 0
          ? Number((item.ratingsSum / item.totalReviews).toFixed(1))
          : 0,
    }));

    listingSummary.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.totalReviews - a.totalReviews;
    });

    res.json({
      meta: {
        totalReviews,
        averageRating,
        breakdown,
      },
      latestReviews: reviews.slice(0, 10),
      listingSummary,
    });
  } catch (e) {
    next(e);
  }
}