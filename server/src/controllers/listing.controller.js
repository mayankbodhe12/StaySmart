import Listing from "../models/Listing.js";
import {
  createListingSchema,
  updateListingSchema,
} from "../validators/listing.validators.js";
import { calculateBookingPrice } from "../utils/pricing.js";
import Booking from "../models/Booking.js";


function isOwnerOrAdmin(listing, req) {
  const isOwner = String(listing.hostId) === String(req.user.sub);
  const isAdmin = req.user.role === "admin";
  return isOwner || isAdmin;
}

function normalizeRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (end < start) {
    return null;
  }

  return { start, end };
}

function rangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);
}


export async function createListing(req, res, next) {
  try {
    const data = createListingSchema.parse(req.body);

    const listing = await Listing.create({
      ...data,
      hostId: req.user.sub,
      status: "active", // dev: directly active
    });

    res.status(201).json({ listing });
  } catch (e) {
    if (e?.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Validation error", details: e.errors });
    }
    next(e);
  }
}


export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const isOwner = String(listing.hostId) === String(req.user.sub);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this listing" });
    }

    const activeBooking = await Booking.findOne({
      listingId: id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: "Cannot delete listing with active bookings",
      });
    }

    await Listing.findByIdAndDelete(id);

    res.json({
      ok: true,
      message: "Listing deleted successfully",
    });
  } catch (e) {
    next(e);
  }
}

export async function getMyListings(req, res, next) {
  try {
    const listings = await Listing.find({ hostId: req.user.sub }).sort({
      createdAt: -1,
    });
    res.json({ listings });
  } catch (e) {
    next(e);
  }
}

// Public listings search (basic)
export async function getListings(req, res, next) {
  try {
    const {
      q,
      minPrice,
      maxPrice,
      guests,
      ecoTags, // comma separated: solar,recycling
      limit = 20,
      page = 1,
    } = req.query;

    const filter = { status: "active" };

    if (q) filter.locationText = { $regex: q, $options: "i" };
    if (minPrice || maxPrice) {
      filter.priceBase = {};
      if (minPrice) filter.priceBase.$gte = Number(minPrice);
      if (maxPrice) filter.priceBase.$lte = Number(maxPrice);
    }
    if (guests) filter.maxGuests = { $gte: Number(guests) };
    if (ecoTags) filter.ecoTags = { $in: String(ecoTags).split(",") };

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, total, page: Number(page) });
  } catch (e) {
    next(e);
  }
}

export async function getListingById(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json({ listing });
  } catch (e) {
    next(e);
  }
}


export async function searchListings(req, res, next) {
  try {
    const {
      q = "",
      guests,
      minPrice,
      maxPrice,
      amenities,
      sort = "newest",
    } = req.query;

    const filter = {
      status: "active",
    };

    if (q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { locationText: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
      ];
    }

    if (guests) {
      filter.maxGuests = { $gte: Number(guests) };
    }

    if (minPrice || maxPrice) {
      filter.priceBase = {};
      if (minPrice) filter.priceBase.$gte = Number(minPrice);
      if (maxPrice) filter.priceBase.$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenitiesArr = String(amenities)
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      if (amenitiesArr.length) {
        filter.amenities = { $all: amenitiesArr };
      }
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { priceBase: 1 };
    if (sort === "price_desc") sortOption = { priceBase: -1 };
    if (sort === "guests_desc") sortOption = { maxGuests: -1 };

    const listings = await Listing.find(filter).sort(sortOption);

    res.json({ listings });
  } catch (e) {
    next(e);
  }
}

export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const isOwner = String(listing.hostId) === String(req.user.sub);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not allowed to edit this listing" });
    }

    const updated = await Listing.findByIdAndUpdate(
      id,
      {
        title: req.body.title,
        description: req.body.description,
        locationText: req.body.locationText,
        lat: req.body.lat,
        lng: req.body.lng,
        priceBase: req.body.priceBase,
        images: req.body.images || [],
        amenities: req.body.amenities || [],
        rules: req.body.rules || [],
        maxGuests: req.body.maxGuests,
        ecoTags: req.body.ecoTags || [],
        status: req.body.status || "active",
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Listing updated successfully",
      listing: updated,
    });
  } catch (e) {
    next(e);
  }
}

export async function getPricePreview(req, res, next) {
  try {
    const { listingId, checkIn, checkOut } = req.query;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({
        message: "listingId, checkIn and checkOut are required",
      });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const pricing = calculateBookingPrice(listing, checkIn, checkOut);

    if (pricing.nights <= 0) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    res.json(pricing);
  } catch (e) {
    next(e);
  }
}

export async function getSimilarListings(req, res, next) {
  try {
    const { id } = req.params;

    const current = await Listing.findById(id);
    if (!current) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listings = await Listing.find({
      _id: { $ne: current._id },
      status: "active",
      $or: [
        { locationText: { $regex: current.locationText, $options: "i" } },
        { maxGuests: current.maxGuests },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({ listings });
  } catch (e) {
    next(e);
  }
}

export async function getBlockedRanges(req, res, next) {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).select(
      "_id title hostId blockedRanges status"
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (!isOwnerOrAdmin(listing, req)) {
      return res
        .status(403)
        .json({ message: "Not allowed to view blocked ranges for this listing" });
    }

    res.json({
      listingId: listing._id,
      title: listing.title,
      blockedRanges: (listing.blockedRanges || []).sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function addBlockedRange(req, res, next) {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason = "" } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    const normalized = normalizeRange(startDate, endDate);
    if (!normalized) {
      return res.status(400).json({
        message: "Invalid blocked date range",
      });
    }

    const { start, end } = normalized;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (!isOwnerOrAdmin(listing, req)) {
      return res
        .status(403)
        .json({ message: "Not allowed to update this listing availability" });
    }

    const hasBlockedConflict = (listing.blockedRanges || []).some((range) =>
      rangesOverlap(start, end, range.startDate, range.endDate)
    );

    if (hasBlockedConflict) {
      return res.status(400).json({
        message: "This blocked range overlaps with an existing blocked range",
      });
    }

    const bookingConflict = await Booking.findOne({
      listingId: listing._id,
      status: { $in: ["pending", "confirmed"] },
      checkIn: { $lte: end },
      checkOut: { $gte: start },
    }).select("_id checkIn checkOut");

    if (bookingConflict) {
      return res.status(400).json({
        message: "Cannot block dates that overlap with an active booking",
      });
    }

    listing.blockedRanges.push({
      startDate: start,
      endDate: end,
      reason: String(reason || "").trim(),
    });

    await listing.save();

    res.status(201).json({
      message: "Blocked range added successfully",
      blockedRanges: (listing.blockedRanges || []).sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      ),
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteBlockedRange(req, res, next) {
  try {
    const { id, rangeId } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (!isOwnerOrAdmin(listing, req)) {
      return res
        .status(403)
        .json({ message: "Not allowed to update this listing availability" });
    }

    const existing = listing.blockedRanges.id(rangeId);
    if (!existing) {
      return res.status(404).json({ message: "Blocked range not found" });
    }

    existing.deleteOne();
    await listing.save();

    res.json({
      message: "Blocked range removed successfully",
      blockedRanges: (listing.blockedRanges || []).sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      ),
    });
  } catch (e) {
    next(e);
  }
}