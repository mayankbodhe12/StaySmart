// server/controllers/hostAnalyticsController.js
import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export const getHostAnalytics = async (req, res) => {
  try {
    const hostId = req.user?.id; // JWT middleware should set req.user.id
    if (!hostId) return res.status(401).json({ message: "Unauthorized" });

    const { from, to } = req.query;

    const fromDate = from
      ? startOfDay(from)
      : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = to ? endOfDay(to) : endOfDay(new Date());

    const match = {
      hostId,
      createdAt: { $gte: fromDate, $lte: toDate },
    };

    // 1) totals + breakdown
    const totalsAgg = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },

          confirmed: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
          pendingStatus: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },

          pending: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ["$paymentStatus", "partial"] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
        },
      },
    ]);

    const totals =
      totalsAgg[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmed: 0,
        pendingStatus: 0,
        cancelled: 0,
        pending: 0,
        partial: 0,
        paid: 0,
      };

    // 2) daily trend (revenue + count)
    const trend = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.y",
              month: "$_id.m",
              day: "$_id.d",
            },
          },
          revenue: 1,
          count: 1,
        },
      },
    ]);

    // 3) top listings (by revenue)
    // booking ke listingId se Listing fetch karke title/locationText attach
    const topListingsAgg = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$listingId",
          revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const listingIds = topListingsAgg.map((x) => x._id);
    const listings = await Listing.find({ _id: { $in: listingIds } })
      .select("title locationText")
      .lean();

    const listingMap = new Map(listings.map((l) => [String(l._id), l]));

    const topListings = topListingsAgg.map((x) => {
      const info = listingMap.get(String(x._id));
      return {
        listingId: x._id,
        title: info?.title || "Untitled",
        locationText: info?.locationText || "-",
        revenue: x.revenue,
        bookings: x.bookings,
      };
    });

    return res.json({
      range: { from: fromDate, to: toDate },
      totals,
      trend,
      topListings,
    });
  } catch (err) {
    console.error("getHostAnalytics error:", err);
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
};