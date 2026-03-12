import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getGroupBooking } from "../api/bookings";
import { createRzpOrder, verifyRzpPayment } from "../api/payments";
import { socket } from "../lib/socket";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function computeProgress(booking) {
  const members = booking?.splitMembers || [];
  const total = members.length;
  const paid = members.filter((m) => m.paid).length;
  const pct = total ? Math.round((paid / total) * 100) : 0;
  return { total, paid, pct };
}

function formatINR(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function DetailCard({ label, value, dark = false }) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${
        dark
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`text-[11px] font-medium uppercase tracking-wide ${
          dark ? "text-white/50" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ paid }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {paid ? "PAID" : "PENDING"}
    </span>
  );
}

export default function JoinGroup() {
  const { groupId } = useParams();

  const [booking, setBooking] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [payingEmail, setPayingEmail] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    setErr("");

    try {
      const res = await getGroupBooking(groupId);
      setBooking(res.data.booking);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load group booking");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    load();

    socket.emit("join:group", { groupId });

    const onUpdate = async (payload) => {
      if (payload?.groupId !== groupId) return;
      await load(false);
    };

    socket.on("booking:updated", onUpdate);

    return () => {
      socket.off("booking:updated", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function handleRefresh() {
    setRefreshing(true);
    setMsg("");
    await load(false);
    setRefreshing(false);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Failed to copy link");
    }
  }

  async function payNow(memberEmail) {
    setErr("");
    setMsg("");

    if (!booking?._id) {
      setErr("Booking not loaded");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setErr("Razorpay SDK failed to load. Check internet connection.");
      return;
    }

    try {
      setPayingEmail(memberEmail);

      const orderRes = await createRzpOrder(booking._id, memberEmail);

      const {
        orderId,
        amount,
        currency,
        bookingId,
        email,
        key,
        name,
        description,
      } = orderRes.data;

      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: currency || "INR",
        name: name || "StaySmart",
        description: description || "Split payment",
        order_id: orderId,
        prefill: {
          email: email || memberEmail,
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function () {
            setMsg("Payment window closed.");
          },
        },
        handler: async function (response) {
          try {
            await verifyRzpPayment({
              bookingId: bookingId || booking._id,
              email: email || memberEmail,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setMsg("Payment successful ✅");
            await load(false);
          } catch (e) {
            setErr(
              e.response?.data?.message || "Payment verification failed on server"
            );
          } finally {
            setPayingEmail("");
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setErr(
          response?.error?.description || "Payment failed. Please try again."
        );
        setPayingEmail("");
      });

      rzp.open();
    } catch (e) {
      setErr(e.response?.data?.message || "Payment failed");
      setPayingEmail("");
    }
  }

  const progress = useMemo(() => computeProgress(booking), [booking]);

  const allPaid =
    booking?.splitMembers?.length > 0 &&
    booking.splitMembers.every((m) => m.paid);

  const pendingMembers = booking?.splitMembers?.filter((m) => !m.paid) || [];
  const paidMembers = booking?.splitMembers?.filter((m) => m.paid) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 text-slate-600 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          Loading group booking...
        </div>
      </div>
    );
  }

  if (err && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-[28px] bg-red-50 p-6 text-red-700">
          {err}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 text-slate-700">
          No booking found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>💳 Group split payment</span>
                <span className="text-white/30">•</span>
                <span>Fast, clear and premium payment flow</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Join & Pay
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Complete your split share, track payment progress in real time,
                and keep the group booking fully funded without confusion.
              </p>

              <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85">
                Group ID: <span className="font-mono">{booking.groupId}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {copied ? "Copied ✅" : "Copy Link"}
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh Status"}
              </button>

              <Link
                to="/"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Home
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {err && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {msg && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {msg}
          </div>
        )}

        {/* Main summary */}
        <div className="mt-8 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            {/* Left */}
            <div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Booking Summary
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {booking.listing?.title || "Listing"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {booking.listing?.locationText || "Location unavailable"}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DetailCard
                  label="Total Amount"
                  value={formatINR(booking.totalAmount)}
                  dark
                />
                <DetailCard
                  label="Payment Status"
                  value={allPaid ? "Paid ✅" : booking.paymentStatus}
                />
                <DetailCard
                  label="Paid Members"
                  value={`${progress.paid}/${progress.total}`}
                />
                <DetailCard
                  label="Pending Members"
                  value={pendingMembers.length}
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-900">
                  Booking Info
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Booking ID
                    </div>
                    <div className="mt-1 break-all text-sm font-medium text-slate-800">
                      {booking._id}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Group Link
                    </div>
                    <div className="mt-1 break-all text-sm font-medium text-slate-800">
                      /join/{booking.groupId}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right progress panel */}
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    Payment Progress
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Track how much of the group booking is funded
                  </div>
                </div>

                <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                  {progress.pct}%
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Funding progress</span>
                  <span>{progress.paid} paid</span>
                </div>

                <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-3.5 rounded-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Paid Members
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {paidMembers.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Pending Members
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {pendingMembers.length}
                  </div>
                </div>
              </div>

              {allPaid ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  All shares are paid. This booking is fully funded.
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Some members still need to complete their payment shares.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="mt-8 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                Split Members
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Each member can pay their assigned share individually
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {booking.splitMembers?.length || 0} member
              {(booking.splitMembers?.length || 0) !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {(booking.splitMembers || []).map((m, idx) => (
              <div
                key={idx}
                className="rounded-[24px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)] sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        Member {idx + 1}
                      </div>
                      <StatusBadge paid={m.paid} />
                    </div>

                    <div className="mt-4 break-all text-lg font-semibold text-slate-900">
                      {m.email}
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      Share Amount
                    </div>

                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {formatINR(m.amount)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {m.paid ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                        Payment completed
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                          Waiting for payment
                        </div>

                        <button
                          type="button"
                          onClick={() => payNow(m.email)}
                          disabled={payingEmail === m.email}
                          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {payingEmail === m.email ? "Processing..." : "Pay Now"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom helper */}
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="font-semibold text-slate-900">How this works</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              1. Each invited member opens this page and checks their payment share.
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              2. Members pay individually through Razorpay in a secure checkout flow.
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              3. Once all shares are paid, the booking becomes fully funded.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}