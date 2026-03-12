import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

function normalizeDateRange(from, to) {
  const now = new Date();

  let start = from ? new Date(from) : new Date(now);
  let end = to ? new Date(to) : new Date(now);

  if (!from) {
    start.setDate(start.getDate() - 29);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (start > end) {
    return null;
  }

  return { start, end };
}

export async function getHostAnalytics(req, res, next) {
  try {
    const hostObjectId = new mongoose.Types.ObjectId(req.user.sub);

    const range = normalizeDateRange(req.query.from, req.query.to);
    if (!range) {
      return res.status(400).json({
        message: "Invalid date range",
      });
    }

    const { start, end } = range;

    const [
      totalListings,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      revenueAgg,
      avgRatingAgg,
      listingPerformance,
      trendAgg,
    ] = await Promise.all([
      Listing.countDocuments({
        hostId: hostObjectId,
      }),

      Booking.countDocuments({
        hostId: hostObjectId,
      }),

      Booking.countDocuments({
        hostId: hostObjectId,
        status: "confirmed",
      }),

      Booking.countDocuments({
        hostId: hostObjectId,
        status: "pending",
      }),

      Booking.aggregate([
        {
          $match: {
            hostId: hostObjectId,
            createdAt: { $gte: start, $lte: end },
            status: { $in: ["pending", "confirmed"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalBookings: { $sum: 1 },
          },
        },
      ]),

      Review.aggregate([
        {
          $match: {
            hostId: hostObjectId,
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            hostId: hostObjectId,
            status: { $in: ["pending", "confirmed"] },
          },
        },
        {
          $group: {
            _id: "$listingId",
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { revenue: -1, bookings: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "listings",
            localField: "_id",
            foreignField: "_id",
            as: "listing",
          },
        },
        {
          $unwind: {
            path: "$listing",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            listingId: "$_id",
            title: { $ifNull: ["$listing.title", "Unknown Listing"] },
            locationText: { $ifNull: ["$listing.locationText", ""] },
            bookings: 1,
            revenue: 1,
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            hostId: hostObjectId,
            createdAt: { $gte: start, $lte: end },
            status: { $in: ["pending", "confirmed"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]),
    ]);

    const totals = {
      totalListings,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      averageRating: Number((avgRatingAgg[0]?.averageRating || 0).toFixed(1)),
      totalReviews: avgRatingAgg[0]?.totalReviews || 0,
    };

    const topPerformingListing = listingPerformance[0] || null;

    const trend = trendAgg.map((item) => {
      const yyyy = item._id.year;
      const mm = String(item._id.month).padStart(2, "0");
      const dd = String(item._id.day).padStart(2, "0");

      return {
        date: `${yyyy}-${mm}-${dd}`,
        revenue: item.revenue,
        count: item.count,
      };
    });

    return res.json({
      totals,
      topPerformingListing,
      topListings: topPerformingListing ? [topPerformingListing] : [],
      trend,
      range: {
        from: start,
        to: end,
      },
    });
  } catch (e) {
    next(e);
  }
}