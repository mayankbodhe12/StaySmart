import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getListingById,
  getPricePreview,
  getSimilarListings,
} from "../api/listings";
import {
  checkAvailability,
  createBooking,
  getBookedRanges,
} from "../api/bookings";
import useAuthStore from "../store/authStore";
import { getListingReviews } from "../api/reviews";
import { getWishlistStatus, toggleWishlist } from "../api/wishlist";
import { getStayBadges } from "../utils/recommend";

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const ms = b.getTime() - a.getTime();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function rangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function StayCard({ item }) {
  return (
    <Link
      to={`/listing/${item._id}`}
      className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-500">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="line-clamp-1 text-base font-semibold text-slate-900">
          {item.title}
        </div>
        <div className="mt-1 line-clamp-1 text-sm text-slate-500">
          {item.locationText}
        </div>
        <div className="mt-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
            ₹{item.priceBase}/night
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.accessToken);

  const [listing, setListing] = useState(null);
  const [pageErr, setPageErr] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [bookingErr, setBookingErr] = useState("");
  const [msg, setMsg] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  const [splitMode, setSplitMode] = useState(false);
  const [splitEmails, setSplitEmails] = useState([""]);
  const [createdGroupId, setCreatedGroupId] = useState("");
  const [bookedRanges, setBookedRanges] = useState([]);

  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ total: 0, averageRating: 0 });

  const [saved, setSaved] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [pricePreview, setPricePreview] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [similarListings, setSimilarListings] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function loadPage() {
      try {
        const res = await getListingById(id);
        const currentListing = res.data.listing;
        setListing(currentListing);

        try {
          const wishlistRes = await getWishlistStatus(id);
          setSaved(!!wishlistRes.data.saved);
        } catch {}

        try {
          const similarRes = await getSimilarListings(id);
          setSimilarListings(similarRes.data.listings || []);
        } catch {
          setSimilarListings([]);
        }

        try {
          const reviewRes = await getListingReviews(id);
          setReviews(reviewRes.data.reviews || []);
          setReviewMeta(reviewRes.data.meta || { total: 0, averageRating: 0 });
        } catch {
          setReviews([]);
          setReviewMeta({ total: 0, averageRating: 0 });
        }

        try {
          const bookedRes = await getBookedRanges(id);
          setBookedRanges(bookedRes.data.ranges || []);
        } catch {
          setBookedRanges([]);
        }

        const key = "staysmart_recently_viewed";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");

        const cleaned = existing.filter(
          (item) => item._id !== currentListing._id,
        );

        const updated = [
          {
            _id: currentListing._id,
            title: currentListing.title,
            locationText: currentListing.locationText,
            priceBase: currentListing.priceBase,
            images: currentListing.images || [],
          },
          ...cleaned,
        ].slice(0, 6);

        localStorage.setItem(key, JSON.stringify(updated));

        setRecentlyViewed(
          updated.filter((item) => item._id !== currentListing._id),
        );
      } catch (e) {
        setPageErr(e.response?.data?.message || "Failed to load listing");
      }
    }

    loadPage();
  }, [id]);

  useEffect(() => {
    async function loadPricePreview() {
      if (!listing?._id || !checkIn || !checkOut) {
        setPricePreview(null);
        return;
      }

      try {
        setPriceLoading(true);
        const res = await getPricePreview({
          listingId: listing._id,
          checkIn,
          checkOut,
        });
        setPricePreview(res.data);
      } catch {
        setPricePreview(null);
      } finally {
        setPriceLoading(false);
      }
    }

    loadPricePreview();
  }, [listing?._id, checkIn, checkOut]);

  const nights = useMemo(
    () => nightsBetween(checkIn, checkOut),
    [checkIn, checkOut],
  );

  const total = useMemo(
    () => (listing ? Number(listing.priceBase || 0) * nights : 0),
    [listing, nights],
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }, []);

  const selectedRangeConflict = useMemo(() => {
    if (!checkIn || !checkOut || !bookedRanges.length) return null;

    return bookedRanges.find((range) =>
      rangesOverlap(checkIn, checkOut, range.checkIn, range.checkOut),
    );
  }, [checkIn, checkOut, bookedRanges]);

  function updateSplitEmail(index, value) {
    setSplitEmails((prev) => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  }

  function addSplitEmailField() {
    setSplitEmails((prev) => [...prev, ""]);
  }

  function removeSplitEmailField(index) {
    setSplitEmails((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCheckAvailability() {
    if (!listing?._id || !checkIn || !checkOut) {
      setBookingErr("Please select check-in and check-out dates");
      return;
    }

    setBookingErr("");
    setMsg("");
    setAvailability(null);
    setAvailabilityLoading(true);

    try {
      const res = await checkAvailability({
        listingId: listing._id,
        checkIn,
        checkOut,
      });

      setAvailability(res.data);
    } catch (e) {
      setAvailability(null);
      setBookingErr(
        e.response?.data?.message || "Failed to check availability",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function onBook() {
    if (!token) {
      setBookingErr("Please login to book this stay");
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingErr("Please select check-in and check-out dates");
      return;
    }

    if (selectedRangeConflict) {
      setBookingErr(
        selectedRangeConflict.type === "host_blocked"
          ? "Selected dates are blocked by the host"
          : "Selected dates already have a booking",
      );
      return;
    }

    if (Number(guests) < 1) {
      setBookingErr("Guests must be at least 1");
      return;
    }

    if (Number(guests) > Number(listing.maxGuests)) {
      setBookingErr(`Max allowed guests is ${listing.maxGuests}`);
      return;
    }

    if (availability && !availability.available) {
      setBookingErr("Selected dates are not available for this listing");
      return;
    }

    setBookingErr("");
    setMsg("");
    setBookingLoading(true);

    try {
      const cleanEmails = splitMode
        ? splitEmails.map((e) => e.trim()).filter(Boolean)
        : [];

      const res = await createBooking({
        listingId: listing._id,
        checkIn,
        checkOut,
        guests: Number(guests),
        splitEmails: cleanEmails,
      });

      const booking = res.data.booking;
      setCreatedBooking(booking);
      setCreatedGroupId(booking?.groupId || "");

      if (booking?.groupId) {
        setMsg("Group booking created successfully.");
      } else {
        setMsg("Booking created successfully.");
      }
    } catch (e) {
      setBookingErr(e.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleToggleWishlist() {
    try {
      setWishlistLoading(true);
      const res = await toggleWishlist(id);
      setSaved(res.data.saved);
    } catch (e) {
      setBookingErr(e.response?.data?.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  }

  function openLightbox(index) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function nextImage() {
    if (!listing?.images?.length) return;
    setLightboxIndex((prev) => (prev + 1) % listing.images.length);
  }

  function prevImage() {
    if (!listing?.images?.length) return;
    setLightboxIndex((prev) =>
      prev === 0 ? listing.images.length - 1 : prev - 1,
    );
  }

  if (pageErr && !listing) {
    return <div className="p-6 text-red-700">{pageErr}</div>;
  }

  if (!listing) {
    return <div className="p-6">Loading...</div>;
  }

  const galleryImages =
    listing.images?.length > 0 ? listing.images : [null, null, null, null];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
                <span>✨ Premium stay</span>
                <span className="text-slate-300">•</span>
                <span>Smart booking experience</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {listing.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span>
                  ⭐ {reviewMeta.averageRating || 0} · {reviewMeta.total} review
                  {reviewMeta.total !== 1 ? "s" : ""}
                </span>
                <span>📍 {listing.locationText}</span>
                <span>👥 Max {listing.maxGuests} guests</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {getStayBadges(listing).map((b, i) => (
                  <span
                    key={i}
                    className="rounded-full border bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
                  >
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                  saved
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {saved ? "♥ Saved" : "♡ Save"}
              </button>

              <Link
                to="/"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Home
              </Link>

              <Link
                to="/bookings"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          {/* Left content */}
          <div className="space-y-8">
            {/* Gallery */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <div className="grid gap-2 p-2 md:grid-cols-2">
                {galleryImages.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] overflow-hidden rounded-[20px] bg-slate-100"
                  >
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        onClick={() => openLightbox(i)}
                        className="h-full w-full cursor-pointer object-cover transition duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        No Image
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <SectionCard
              title="About this stay"
              subtitle="Everything you should know before booking"
            >
              <p className="text-sm leading-7 text-slate-700">
                {listing.description || "—"}
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Amenities
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">
                    {listing.amenities?.length
                      ? listing.amenities.join(", ")
                      : "—"}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    House rules
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">
                    {listing.rules?.length ? listing.rules.join(", ") : "—"}
                  </div>
                </div>
              </div>

              {listing.ecoTags?.length > 0 && (
                <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-800">
                    Eco-friendly highlights
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {listing.ecoTags.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Reviews"
              subtitle={`${reviewMeta.total} guest review${
                reviewMeta.total !== 1 ? "s" : ""
              } • Average rating ${reviewMeta.averageRating || 0}`}
            >
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <div className="text-lg font-semibold text-slate-800">
                      No reviews yet
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Be the first guest to book and review this stay.
                    </p>
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                    >
                      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {r.guestId?.name || r.guestId?.email || "Guest"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
                            ⭐ {r.rating}/5
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <div className="text-sm leading-7 text-slate-700">
                          {r.comment || "No comment"}
                        </div>

                        {r.hostReply?.text && (
                          <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Host reply
                            </div>
                            <div className="mt-2 text-sm leading-7 text-slate-700">
                              {r.hostReply.text}
                            </div>
                            {r.hostReply.repliedAt && (
                              <div className="mt-2 text-xs text-slate-500">
                                {new Date(
                                  r.hostReply.repliedAt,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            {/*  EXACT POSITION: Reviews ke turant baad add kiya gaya */}
            {bookedRanges.length > 0 && (
              <SectionCard
                title="Unavailable dates"
                subtitle="These date ranges are unavailable because of bookings or host blocks"
              >
                <div className="grid gap-3">
                  {bookedRanges.map((r, idx) => {
                    const isHostBlocked = r.type === "host_blocked";

                    return (
                      <div
                        key={r.rangeId || idx}
                        className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {new Date(r.checkIn).toLocaleDateString()} -{" "}
                            {new Date(r.checkOut).toLocaleDateString()}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {isHostBlocked
                              ? r.reason
                                ? `Host blocked these dates: ${r.reason}`
                                : "These dates are blocked by the host"
                              : "These dates already have bookings"}
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                            isHostBlocked
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {isHostBlocked ? "host blocked" : "booked"}
                        </span>

                        {!isHostBlocked && r.paymentStatus && (
                          <div className="text-xs text-slate-400 sm:text-right">
                            payment: {r.paymentStatus}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {similarListings.length > 0 && (
              <SectionCard
                title="Similar stays"
                subtitle="More places you may like"
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {similarListings.map((item) => (
                    <StayCard key={item._id} item={item} />
                  ))}
                </div>
              </SectionCard>
            )}

            {recentlyViewed.length > 0 && (
              <SectionCard
                title="Recently viewed"
                subtitle="Continue exploring your previous stays"
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {recentlyViewed.map((item) => (
                    <StayCard key={item._id} item={item} />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Right side booking card */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{listing.priceBase}
                    <span className="ml-1 text-sm font-medium text-slate-500">
                      /night
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Max guests: {listing.maxGuests}
                  </div>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {nights} night{nights !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Check-in
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Check-out
                  </label>
                  <input
                    type="date"
                    min={checkIn || todayStr}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  />
                </div>

                {selectedRangeConflict && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      selectedRangeConflict.type === "host_blocked"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {selectedRangeConflict.type === "host_blocked" ? (
                      <>
                        These selected dates are blocked by the host from{" "}
                        {new Date(
                          selectedRangeConflict.checkIn,
                        ).toLocaleDateString()}{" "}
                        to{" "}
                        {new Date(
                          selectedRangeConflict.checkOut,
                        ).toLocaleDateString()}
                        {selectedRangeConflict.reason
                          ? ` (${selectedRangeConflict.reason})`
                          : ""}
                        .
                      </>
                    ) : (
                      <>
                        These selected dates overlap with an existing booking
                        from{" "}
                        {new Date(
                          selectedRangeConflict.checkIn,
                        ).toLocaleDateString()}{" "}
                        to{" "}
                        {new Date(
                          selectedRangeConflict.checkOut,
                        ).toLocaleDateString()}
                        .
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={listing.maxGuests}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={splitMode}
                    onChange={(e) => setSplitMode(e.target.checked)}
                  />
                  Split with friends
                </label>

                {splitMode && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-slate-500">
                      Add emails of friends who will pay their share
                    </div>

                    {splitEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            updateSplitEmail(index, e.target.value)
                          }
                          placeholder="friend@example.com"
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                        />
                        {splitEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSplitEmailField(index)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addSplitEmailField}
                      className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      + Add Friend
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  disabled={availabilityLoading}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {availabilityLoading ? "Checking..." : "Check Availability"}
                </button>

                <button
                  type="button"
                  onClick={onBook}
                  disabled={
                    bookingLoading ||
                    (availability && !availability.available) ||
                    !!selectedRangeConflict
                  }
                  className="flex-1 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingLoading ? "Booking..." : "Reserve"}
                </button>
              </div>

              <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Nights</span>
                  <span>{nights}</span>
                </div>

                <div className="mt-2 flex justify-between font-semibold text-slate-900">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                {priceLoading && (
                  <div className="mt-3 text-xs text-slate-500">
                    Calculating live price...
                  </div>
                )}

                {pricePreview && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex justify-between font-medium text-slate-800">
                      <span>Dynamic total</span>
                      <span>₹{pricePreview.totalAmount}</span>
                    </div>

                    <div className="mt-3 space-y-1">
                      {pricePreview.breakdown.slice(0, 5).map((x, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-xs text-slate-500"
                        >
                          <span>
                            {new Date(x.date).toLocaleDateString()} ({x.rule})
                          </span>
                          <span>₹{x.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedRangeConflict && (
                <div
                  className={`mt-4 rounded-2xl p-3 text-xs ${
                    selectedRangeConflict.type === "host_blocked"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {selectedRangeConflict.type === "host_blocked"
                    ? "Selected dates are host-blocked. Please choose different dates."
                    : "Selected dates are already booked. Please choose different dates."}
                </div>
              )}

              {!token && (
                <p className="mt-4 text-xs text-slate-500">
                  Login required to book this stay.
                </p>
              )}

              {availability && (
                <div
                  className={`mt-4 rounded-2xl p-3 text-sm ${
                    availability.available
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {availability.available ? (
                    "These dates are available."
                  ) : availability.conflict?.type === "host_blocked" ? (
                    <>
                      These dates are blocked by the host between{" "}
                      {new Date(
                        availability.conflict.checkIn,
                      ).toLocaleDateString()}{" "}
                      and{" "}
                      {new Date(
                        availability.conflict.checkOut,
                      ).toLocaleDateString()}
                      .
                      {availability.conflict.reason
                        ? ` Reason: ${availability.conflict.reason}.`
                        : ""}
                    </>
                  ) : (
                    <>
                      These dates are not available. Booked between{" "}
                      {new Date(
                        availability.conflict.checkIn,
                      ).toLocaleDateString()}{" "}
                      and{" "}
                      {new Date(
                        availability.conflict.checkOut,
                      ).toLocaleDateString()}
                      .
                    </>
                  )}
                </div>
              )}

              {bookingErr && (
                <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                  {bookingErr}
                </div>
              )}

              {msg && (
                <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-700">
                  {msg}
                </div>
              )}

              {createdGroupId && (
                <div className="mt-4 rounded-[22px] border border-green-200 bg-green-50 p-4">
                  <div className="text-sm font-semibold text-green-800">
                    Group booking created successfully
                  </div>

                  <div className="mt-2 text-sm text-green-700">
                    Group ID:{" "}
                    <span className="font-mono">{createdGroupId}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/join/${createdGroupId}`}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                    >
                      Open Join & Pay Page
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/join/${createdGroupId}`,
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      Copy Join Link
                    </button>
                  </div>
                </div>
              )}

              {createdBooking && (
                <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Booking Summary
                  </div>

                  <div className="mt-2 text-sm text-slate-700">
                    Booking ID:{" "}
                    <span className="font-mono">{createdBooking._id}</span>
                  </div>

                  {createdBooking.groupId && (
                    <div className="mt-2 text-sm text-slate-700">
                      Group ID:{" "}
                      <span className="font-mono">
                        {createdBooking.groupId}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 rounded-xl bg-black py-2 text-sm font-medium text-white"
                      onClick={() => navigate("/bookings")}
                    >
                      Go to My Bookings
                    </button>

                    {createdBooking.groupId && (
                      <button
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700"
                        onClick={() =>
                          navigate(`/join/${createdBooking.groupId}`)
                        }
                      >
                        Join Page
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {lightboxOpen && listing?.images?.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <button
              onClick={closeLightbox}
              className="absolute right-6 top-6 text-3xl text-white"
            >
              ✕
            </button>

            <button
              onClick={prevImage}
              className="absolute left-6 text-4xl text-white"
            >
              ‹
            </button>

            <img
              src={listing.images[lightboxIndex]}
              alt=""
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            />

            <button
              onClick={nextImage}
              className="absolute right-6 text-4xl text-white"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
