import Wishlist from "../models/Wishlist.js";
import Listing from "../models/Listing.js";

export async function getMyWishlist(req, res, next) {
  try {
    const items = await Wishlist.find({ userId: req.user.sub })
      .populate("listingId")
      .sort({ createdAt: -1 });

    const listings = items
      .map((item) => item.listingId)
      .filter(Boolean);

    res.json({ listings });
  } catch (e) {
    next(e);
  }
}

export async function toggleWishlist(req, res, next) {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ message: "listingId is required" });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const existing = await Wishlist.findOne({
      userId: req.user.sub,
      listingId,
    });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.json({ saved: false, message: "Removed from wishlist" });
    }

    await Wishlist.create({
      userId: req.user.sub,
      listingId,
    });

    return res.json({ saved: true, message: "Added to wishlist" });
  } catch (e) {
    next(e);
  }
}

export async function getWishlistStatus(req, res, next) {
  try {
    const { listingId } = req.params;

    const exists = await Wishlist.findOne({
      userId: req.user.sub,
      listingId,
    });

    res.json({ saved: !!exists });
  } catch (e) {
    next(e);
  }
}