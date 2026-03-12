// client/src/utils/bookingStatus.js

export function getDisplayStatus(b) {
  // If cancelled support ho to:
  if (b?.status === "cancelled") return "cancelled";

  // Confirmed is final stage
  if (b?.status === "confirmed") return "confirmed";

  // paymentStatus based stages
  if (b?.paymentStatus === "paid") return "paid";
  if (b?.paymentStatus === "partial") return "partial";

  // fallback
  return "pending";
}

export function getBookingStats(bookings = []) {
  const stats = {
    total: bookings.length,
    pending: 0,
    partial: 0,
    paid: 0,
    confirmed: 0,
  };

  bookings.forEach((b) => {
    const s = getDisplayStatus(b);

    if (s === "pending") stats.pending++;
    if (s === "partial") stats.partial++;
    if (s === "paid") stats.paid++;
    if (s === "confirmed") stats.confirmed++;
  });

  return stats;
}

// optional: badge color helper (UI)
export function getStatusBadge(status) {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", cls: "bg-green-100 text-green-700" };
    case "paid":
      return { label: "Paid", cls: "bg-emerald-100 text-emerald-700" };
    case "partial":
      return { label: "Partial", cls: "bg-yellow-100 text-yellow-700" };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-red-100 text-red-700" };
    default:
      return { label: "Pending", cls: "bg-slate-100 text-slate-700" };
  }
}