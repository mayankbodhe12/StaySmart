import Listing from "../models/Listing.js";
import Booking from "../models/Booking.js";
import Wishlist from "../models/Wishlist.js";

export async function getTrendingListings(req, res, next) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: "$listingId",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const listingIds = bookings.map(b => b._id);

    const listings = await Listing.find({
      _id: { $in: listingIds }
    });

    res.json({
      listings
    });

  } catch (e) {
    next(e);
  }
}