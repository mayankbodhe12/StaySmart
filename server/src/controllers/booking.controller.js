import Booking from "../models/Booking.js";
import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notify.js";
import { calculateBookingPrice } from "../utils/pricing.js";

function blockedRangesOverlap(blockedRanges = [], checkIn, checkOut) {
  return blockedRanges.find((range) =>
    datesOverlap(checkIn, checkOut, range.startDate, range.endDate),
  );
}

function diffNights(checkIn, checkOut) {
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  const ms = outD - inD;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function datesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

export async function createBooking(req, res, next) {
  try {
    const { listingId, checkIn, checkOut, guests, splitEmails = [] } = req.body;

    if (!listingId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        message: "listingId, checkIn, checkOut and guests are required",
      });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    if (outDate <= inDate) {
      return res
        .status(400)
        .json({ message: "Check-out must be after check-in" });
    }

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (Number(guests) < 1) {
      return res.status(400).json({ message: "Guests must be at least 1" });
    }

    if (Number(guests) > Number(listing.maxGuests)) {
      return res.status(400).json({ message: "Guests exceed maxGuests" });
    }

    const conflictingBooking = await Booking.findOne({
      listingId,
      status: { $in: ["pending", "confirmed"] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        message: "Selected dates are not available for this listing",
      });
    }

    const blockedRange = blockedRangesOverlap(
      listing.blockedRanges || [],
      checkIn,
      checkOut,
    );

    if (blockedRange) {
      return res.status(409).json({
        message: "Selected dates are blocked by the host",
        conflict: {
          type: "host_blocked",
          startDate: blockedRange.startDate,
          endDate: blockedRange.endDate,
          reason: blockedRange.reason || "",
        },
      });
    }

    const nights = diffNights(checkIn, checkOut);
    if (nights <= 0) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    const pricing = calculateBookingPrice(listing, checkIn, checkOut);
    const pricePerNight = listing.priceBase;
    const totalAmount = pricing.totalAmount;

    const emails = Array.isArray(splitEmails)
      ? splitEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
      : [];

    const creatorEmail = (req.user.email || "").trim().toLowerCase();
    const uniqueEmails = [...new Set(emails)].filter((e) => e !== creatorEmail);

    let groupId;
    let splitMembers = [];
    let paymentStatus = "paid";
    let status = "confirmed";

    if (uniqueEmails.length > 0) {
      groupId = `grp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const totalMembers = uniqueEmails.length + 1;
      const share = Math.ceil(totalAmount / totalMembers);

      splitMembers = [
        {
          userId: req.user.sub,
          email: creatorEmail || "creator@unknown.com",
          amount: share,
          paid: true,
        },
        ...uniqueEmails.map((email) => ({
          email,
          amount: share,
          paid: false,
        })),
      ];

      paymentStatus = "partial";
      status = "pending";
    }

    const bookingData = {
      listingId,
      hostId: listing.hostId,
      guestId: req.user.sub,
      checkIn,
      checkOut,
      guests: Number(guests),
      nights,
      pricePerNight,
      totalAmount,
      status,
      splitMembers,
      paymentStatus,
    };

    if (groupId) {
      bookingData.groupId = groupId;
    }

    const booking = await Booking.create(bookingData);

    await createNotification(req, {
      userId: listing.hostId,
      type: "booking_created",
      title: "New booking received",
      message: `${req.user.email || "A guest"} booked ${listing.title}`,
      link: "/host/bookings",
      meta: {
        bookingId: booking._id,
        listingId: listing._id,
      },
    });

    return res.status(201).json({ booking });
  } catch (e) {
    next(e);
  }
}

export async function myBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ guestId: req.user.sub })
      .populate("listingId", "title locationText images priceBase")
      .sort({ createdAt: -1 });

    const bookingIds = bookings.map((b) => b._id);

    const reviews = await Review.find({
      bookingId: { $in: bookingIds },
    }).select("bookingId");

    const reviewedSet = new Set(reviews.map((r) => String(r.bookingId)));

    const result = bookings.map((b) => ({
      ...b.toObject(),
      alreadyReviewed: reviewedSet.has(String(b._id)),
    }));

    res.json({ bookings: result });
  } catch (e) {
    next(e);
  }
}

export async function hostBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ hostId: req.user.sub })
      .populate("listingId", "title locationText images priceBase")
      .populate("guestId", "name email")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (e) {
    next(e);
  }
}

export async function getGroupBooking(req, res, next) {
  try {
    const { groupId } = req.params;

    const booking = await Booking.findOne({ groupId }).populate(
      "listingId",
      "title locationText priceBase",
    );

    if (!booking) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requesterEmail = String(req.user.email || "").toLowerCase();
    const isGuestOwner = String(booking.guestId) === String(req.user.sub);
    const isHostOwner = String(booking.hostId) === String(req.user.sub);
    const isInvitedMember = booking.splitMembers.some(
      (m) => String(m.email).toLowerCase() === requesterEmail,
    );
    const isAdmin = req.user.role === "admin";

    if (!isGuestOwner && !isHostOwner && !isInvitedMember && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not allowed to view this group booking" });
    }

    res.json({
      booking: {
        _id: booking._id,
        groupId: booking.groupId,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        status: booking.status,
        listing: booking.listingId,
        splitMembers: booking.splitMembers.map((m) => ({
          email: m.email,
          amount: m.amount,
          paid: m.paid,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function payGroupShare(req, res, next) {
  try {
    const { groupId } = req.params;
    const requesterEmail = String(req.user.email || "").toLowerCase();

    const booking = await Booking.findOne({ groupId });
    if (!booking) {
      return res.status(404).json({ message: "Group not found" });
    }

    const idx = booking.splitMembers.findIndex(
      (m) => String(m.email).toLowerCase() === requesterEmail,
    );

    if (idx === -1) {
      return res
        .status(403)
        .json({ message: "You are not part of this split booking" });
    }

    if (booking.splitMembers[idx].paid) {
      return res.status(400).json({ message: "This share is already paid" });
    }

    booking.splitMembers[idx].paid = true;

    const paidCount = booking.splitMembers.filter((m) => m.paid).length;
    const allPaid = paidCount === booking.splitMembers.length;

    booking.paymentStatus = allPaid ? "paid" : "partial";
    if (allPaid) booking.status = "confirmed";

    await booking.save();

    await createNotification(req, {
      userId: booking.hostId,
      type: "payment_update",
      title: "Payment received",
      message: `${requesterEmail} completed a payment share`,
      link: "/host/bookings",
      meta: {
        bookingId: booking._id,
        groupId: booking.groupId,
      },
    });

    res.json({
      ok: true,
      message: "Payment share marked successfully",
      booking,
    });
  } catch (e) {
    next(e);
  }
}

export async function checkListingAvailability(req, res, next) {
  try {
    const { listingId, checkIn, checkOut } = req.query;

    if (!listingId || !checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "listingId, checkIn and checkOut are required" });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    if (outDate <= inDate) {
      return res
        .status(400)
        .json({ message: "Check-out must be after check-in" });
    }

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    const existingBookings = await Booking.find({
      listingId,
      status: { $in: ["pending", "confirmed"] },
    }).select("checkIn checkOut status paymentStatus");

    const bookingConflict = existingBookings.find((b) =>
      datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut),
    );

    if (bookingConflict) {
      return res.json({
        available: false,
        conflict: {
          type: "booking",
          bookingId: bookingConflict._id,
          checkIn: bookingConflict.checkIn,
          checkOut: bookingConflict.checkOut,
          status: bookingConflict.status,
          paymentStatus: bookingConflict.paymentStatus,
        },
      });
    }

    const blockedConflict = (listing.blockedRanges || []).find((range) =>
      datesOverlap(checkIn, checkOut, range.startDate, range.endDate),
    );

    if (blockedConflict) {
      return res.json({
        available: false,
        conflict: {
          type: "host_blocked",
          rangeId: blockedConflict._id,
          checkIn: blockedConflict.startDate,
          checkOut: blockedConflict.endDate,
          reason: blockedConflict.reason || "",
        },
      });
    }

    return res.json({
      available: true,
      conflict: null,
    });
  } catch (e) {
    next(e);
  }
}

export async function getListingBookedRanges(req, res, next) {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId).select(
      "_id status blockedRanges",
    );

    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    const bookings = await Booking.find({
      listingId,
      status: { $in: ["pending", "confirmed"] },
    })
      .select("checkIn checkOut status paymentStatus")
      .sort({ checkIn: 1 });

    const bookingRanges = bookings.map((b) => ({
      type: "booking",
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      paymentStatus: b.paymentStatus,
    }));

    const blockedRanges = (listing.blockedRanges || []).map((r) => ({
      type: "host_blocked",
      rangeId: r._id,
      checkIn: r.startDate,
      checkOut: r.endDate,
      reason: r.reason || "",
      status: "blocked",
      paymentStatus: null,
    }));

    const ranges = [...bookingRanges, ...blockedRanges].sort(
      (a, b) => new Date(a.checkIn) - new Date(b.checkIn),
    );

    res.json({ ranges });
  } catch (e) {
    next(e);
  }
}
