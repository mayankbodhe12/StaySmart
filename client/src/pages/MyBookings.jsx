import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings } from "../api/bookings";
import { createReview } from "../api/reviews";
import { getBookingChatMeta } from "../api/messages";

function getBookingStatusLabel(b) {
  const hasSplit = Array.isArray(b.splitMembers) && b.splitMembers.length > 0;

  if (!hasSplit) {
    const bookingStatus = b.status || "confirmed";
    const paymentStatus = b.paymentStatus || "paid";

    return {
      bookingStatus,
      paymentStatus,
      combined: `${bookingStatus} • ${paymentStatus}`,
    };
  }

  const totalMembers = b.splitMembers.length;
  const paidMembers = b.splitMembers.filter((m) => m.paid).length;
  const allPaid = totalMembers > 0 && paidMembers === totalMembers;

  if (allPaid) {
    return {
      bookingStatus: "confirmed",
      paymentStatus: "paid",
      combined: "confirmed • paid",
    };
  }

  if (paidMembers > 0) {
    return {
      bookingStatus: b.status || "pending",
      paymentStatus: "partial",
      combined: `${b.status || "pending"} • partial`,
    };
  }

  return {
    bookingStatus: b.status || "pending",
    paymentStatus: "pending",
    combined: `${b.status || "pending"} • pending`,
  };
}

function getStatusPillClass(label) {
  if (label.includes("confirmed") && label.includes("paid")) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (label.includes("partial")) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (label.includes("pending")) {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function StatCard({ title, value, hint, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
    green: "bg-emerald-50 border-emerald-200",
    yellow: "bg-yellow-50 border-yellow-200",
  };

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${tones[tone] || tones.default}`}
    >
      <div
        className={`text-xs font-medium ${
          tone === "dark" ? "text-white/70" : "text-slate-500"
        }`}
      >
        {title}
      </div>
      <div
        className={`mt-2 text-2xl font-bold ${
          tone === "dark" ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      <div
        className={`mt-1 text-xs ${
          tone === "dark" ? "text-white/70" : "text-slate-500"
        }`}
      >
        {hint}
      </div>
    </div>
  );
}

function nightsLabel(b) {
  return `${b.nights} night${b.nights !== 1 ? "s" : ""}`;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [chatMetaMap, setChatMetaMap] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [bookingsRes, chatMetaRes] = await Promise.all([
          getMyBookings(),
          getBookingChatMeta(),
        ]);

        setBookings(bookingsRes.data.bookings || []);

        const map = {};
        (chatMetaRes.data.chatMeta || []).forEach((item) => {
          map[item.bookingId] = item;
        });
        setChatMetaMap(map);
      } catch (e) {
        setErr(e.response?.data?.message || "Failed to load bookings");
      }
    }

    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmitReview() {
    if (!selectedBooking?._id) return;

    setReviewLoading(true);

    try {
      await createReview({
        bookingId: selectedBooking._id,
        rating,
        comment,
      });

      setReviewOpen(false);
      setSelectedBooking(null);
      setRating(5);
      setComment("");

      const res = await getMyBookings();
      setBookings(res.data.bookings || []);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  const stats = useMemo(() => {
    let confirmedPaid = 0;
    let partial = 0;
    let pending = 0;
    let reviewed = 0;

    bookings.forEach((b) => {
      const statusInfo = getBookingStatusLabel(b);

      if (
        statusInfo.bookingStatus === "confirmed" &&
        statusInfo.paymentStatus === "paid"
      ) {
        confirmedPaid++;
      } else if (statusInfo.paymentStatus === "partial") {
        partial++;
      } else {
        pending++;
      }

      if (b.alreadyReviewed) reviewed++;
    });

    return {
      total: bookings.length,
      confirmedPaid,
      partial,
      pending,
      reviewed,
    };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>🧳 Guest booking hub</span>
                <span className="text-white/30">•</span>
                <span>Track stays, payments and chats</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                My Bookings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Manage your upcoming stays, track split payments, chat with
                hosts, and leave reviews after your experience.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ✅ Booking status
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💬 Host chat
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ⭐ Review stays
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Explore Stays
              </Link>

              <Link
                to="/wishlist"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Wishlist
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Bookings"
            value={stats.total}
            hint="All your booked stays"
            tone="dark"
          />
          <StatCard
            title="Confirmed & Paid"
            value={stats.confirmedPaid}
            hint="Ready for travel"
            tone="green"
          />
          <StatCard
            title="Partial Payments"
            value={stats.partial}
            hint="Split bookings in progress"
            tone="yellow"
          />
          <StatCard
            title="Reviews Submitted"
            value={stats.reviewed}
            hint="Completed guest feedback"
            tone="default"
          />
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {bookings.length === 0 && !err && (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
            <div className="text-xl font-semibold text-slate-900">
              No bookings yet
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Once you reserve a stay, it will appear here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Browse stays
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {bookings.map((b) => {
            const listing = b.listingId;
            const title =
              listing && typeof listing === "object"
                ? listing.title
                : "Listing";

            const location =
              listing && typeof listing === "object"
                ? listing.locationText
                : "";

            const statusInfo = getBookingStatusLabel(b);
            const chatMeta = chatMetaMap[b._id] || null;

            return (
              <div
                key={b._id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="line-clamp-1 text-xl font-bold text-slate-900">
                          {title}
                        </h2>

                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStatusPillClass(
                            statusInfo.combined,
                          )}`}
                        >
                          {statusInfo.combined}
                        </div>
                      </div>

                      {location && (
                        <div className="mt-2 line-clamp-1 text-sm text-slate-500">
                          📍 {location}
                        </div>
                      )}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Check-in
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {new Date(b.checkIn).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Check-out
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {new Date(b.checkOut).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Stay details
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {b.guests} guests • {nightsLabel(b)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                            Total paid amount
                          </div>
                          <div className="mt-1 text-sm font-semibold">
                            ₹{b.totalAmount}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-[220px] rounded-[22px] border border-slate-200 bg-white p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Booking info
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div>
                          <span className="font-medium text-slate-800">
                            Booking ID:
                          </span>{" "}
                          <span className="font-mono text-xs">{b._id}</span>
                        </div>

                        {b.groupId && (
                          <div>
                            <span className="font-medium text-slate-800">
                              Group:
                            </span>{" "}
                            <span className="font-mono text-xs">{b.groupId}</span>
                          </div>
                        )}

                        {b.groupId && (
                          <div className="pt-1">
                            <Link
                              className="text-sm font-medium text-blue-600 underline break-all"
                              to={`/join/${b.groupId}`}
                            >
                              /join/{b.groupId}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-6">
                  {Array.isArray(b.splitMembers) && b.splitMembers.length > 0 && (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        Split Members
                      </div>
                      <div className="mt-3 space-y-2">
                        {b.splitMembers.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                          >
                            <div className="text-sm">
                              <div className="font-medium text-slate-900">
                                {m.email}
                              </div>
                              <div className="mt-1 text-slate-500">
                                ₹{m.amount}
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                m.paid
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {m.paid ? "PAID" : "PENDING"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/chat/${b._id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Open Chat
                    </Link>

                    {statusInfo.bookingStatus === "confirmed" &&
                      !b.alreadyReviewed && (
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setReviewOpen(true);
                          }}
                          className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Write Review
                        </button>
                      )}

                    {b.alreadyReviewed && (
                      <div className="inline-flex items-center rounded-2xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
                        Review Submitted ✓
                      </div>
                    )}
                  </div>

                  {chatMeta && (
                    <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Chat activity
                      </div>

                      <div className="mt-2 line-clamp-1 text-sm text-slate-700">
                        <span className="font-medium">Last message:</span>{" "}
                        {chatMeta.lastMessage}
                      </div>

                      {chatMeta.unreadCount > 0 && (
                        <div className="mt-3 inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          {chatMeta.unreadCount} unread
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Write Review
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Share your experience with this stay
                </p>
              </div>

              <button
                onClick={() => {
                  setReviewOpen(false);
                  setSelectedBooking(null);
                }}
                className="text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Rating
              </label>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${
                      star <= rating ? "text-yellow-500" : "text-slate-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Comment
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="min-h-[130px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading}
                className="flex-1 rounded-2xl bg-black py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>

              <button
                onClick={() => {
                  setReviewOpen(false);
                  setSelectedBooking(null);
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}