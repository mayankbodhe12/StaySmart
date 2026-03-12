import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHostBookings } from "../../api/bookings";
import { getHostAnalytics } from "../../api/host";
import { socket } from "../../lib/socket";
import useAuthStore from "../../store/authStore";
import { getBookingChatMeta } from "../../api/messages";

// Charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function computeProgress(b) {
  const members = b.splitMembers || [];
  if (!members.length) return { paid: 0, total: 0, pct: 0 };

  const paid = members.filter((m) => m.paid).length;
  const total = members.length;
  const pct = Math.round((paid / total) * 100);

  return { paid, total, pct };
}

function statusLabel(b) {
  const prog = computeProgress(b);

  if (b.status === "confirmed") return "CONFIRMED";
  if (b.paymentStatus === "paid" || prog.pct === 100) return "PAID";
  if (b.paymentStatus === "partial" || prog.pct > 0) return "PARTIAL";
  return "PENDING";
}

function StatusPill({ label }) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold";

  const map = {
    PENDING: "border-yellow-200 bg-yellow-50 text-yellow-800",
    PARTIAL: "border-blue-200 bg-blue-50 text-blue-800",
    PAID: "border-green-200 bg-green-50 text-green-800",
    CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return <span className={`${base} ${map[label] || ""}`}>{label}</span>;
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>Payment progress</span>
        <span>{pct}%</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-black transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatINR(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function shortDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function StatCard({ title, value, hint, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
    green: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
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

export default function HostBookings() {
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [chatMetaMap, setChatMetaMap] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const user = useAuthStore((s) => s.user);
  const [notif, setNotif] = useState(null);

  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const [range, setRange] = useState(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  });

  async function loadBookings() {
    try {
      const [bookingsRes, chatMetaRes] = await Promise.all([
        getHostBookings(),
        getBookingChatMeta(),
      ]);

      setBookings(bookingsRes.data.bookings || []);

      const map = {};
      (chatMetaRes.data.chatMeta || []).forEach((item) => {
        map[item.bookingId] = item;
      });

      setChatMetaMap(map);
    } catch (e) {
      console.log("Failed to load host bookings", e);
      setErr("Failed to load host bookings");
    }
  }

  async function loadAnalytics() {
    try {
      setLoadingAnalytics(true);

      const res = await getHostAnalytics({
        from: range.from,
        to: range.to,
      });

      setAnalytics(res.data);
    } catch (e) {
      console.log("Failed to load host analytics", e);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      await Promise.all([loadBookings(), loadAnalytics()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [range.from, range.to]);

  useEffect(() => {
    const hostRoomId = user?._id || user?.sub || user?.id;
    if (!hostRoomId) return;

    socket.emit("host:join", hostRoomId);

    const refresh = () => loadBookings();
    socket.on("booking:updated", refresh);

    const onPayment = (data) => {
      setNotif(data);
      setTimeout(() => setNotif(null), 4000);
      loadAnalytics();
      loadBookings();
    };

    socket.on("payment:notification", onPayment);

    return () => {
      socket.off("booking:updated", refresh);
      socket.off("payment:notification", onPayment);
    };
  }, [user?._id, user?.sub, user?.id]);

  const stats = useMemo(() => {
    const total = bookings.length;

    let pending = 0,
      partial = 0,
      paid = 0,
      confirmed = 0;

    for (const b of bookings) {
      const label = statusLabel(b);

      if (label === "PENDING") pending++;
      else if (label === "PARTIAL") partial++;
      else if (label === "PAID") paid++;
      else if (label === "CONFIRMED") confirmed++;
    }

    return { total, pending, partial, paid, confirmed };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const s = search.trim().toLowerCase();

    let list = [...bookings];

    if (payFilter !== "all") {
      list = list.filter((b) => {
        const label = statusLabel(b);
        if (payFilter === "pending") return label === "PENDING";
        if (payFilter === "partial") return label === "PARTIAL";
        if (payFilter === "paid")
          return label === "PAID" || label === "CONFIRMED";
        return true;
      });
    }

    if (s) {
      list = list.filter((b) => {
        const title = b?.listingId?.title?.toLowerCase() || "";
        const guest = (
          b?.guestId?.name ||
          b?.guestId?.email ||
          ""
        ).toLowerCase();
        const id = String(b?._id || "").toLowerCase();
        const groupId = String(b?.groupId || "").toLowerCase();

        return (
          title.includes(s) ||
          guest.includes(s) ||
          id.includes(s) ||
          groupId.includes(s)
        );
      });
    }

    if (sortBy === "amount") {
      list.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [bookings, payFilter, search, sortBy]);

  const totals = analytics?.totals;

  const chartData = useMemo(() => {
    const t = analytics?.trend || [];
    return t.map((x) => ({
      date: shortDate(x.date),
      revenue: Number(x.revenue || 0),
      count: Number(x.count || 0),
    }));
  }, [analytics]);

  const welcomeName =
    user?.name || user?.fullName || user?.email?.split("@")[0] || "Host";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {notif && (
          <div className="fixed right-5 top-5 z-50 rounded-2xl bg-black px-4 py-3 text-white shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
            <div className="text-sm font-semibold">Payment received ✅</div>
            <div className="mt-1 text-sm">
              🔔 {notif.email} paid ₹{notif.amount} for {notif.listingTitle}
            </div>
          </div>
        )}

        {/* Premium Hero Header */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>🏡 Host performance hub</span>
                <span className="text-white/30">•</span>
                <span>Realtime bookings & payments</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Welcome back, {welcomeName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Manage bookings, monitor payment progress, review analytics, and
                stay on top of your hosting performance from one premium
                dashboard.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📈 Revenue insights
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💬 Booking chats
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ⚡ Realtime updates
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadAll}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Refresh Dashboard
              </button>

              <Link
                to="/host/listings"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Manage Listings
              </Link>

              <Link
                to="/"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Analytics Range
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Adjust date range to review revenue and booking performance
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  From
                </div>
                <input
                  type="date"
                  value={range.from}
                  onChange={(e) =>
                    setRange((r) => ({ ...r, from: e.target.value }))
                  }
                  className="mt-1 bg-transparent text-sm outline-none"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  To
                </div>
                <input
                  type="date"
                  value={range.to}
                  onChange={(e) =>
                    setRange((r) => ({ ...r, to: e.target.value }))
                  }
                  className="mt-1 bg-transparent text-sm outline-none"
                />
              </div>

              <div className="pb-1 text-xs text-slate-500">
                {loadingAnalytics ? "Updating analytics…" : "Analytics ready"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Bookings"
            value={stats.total}
            hint="All bookings received"
            tone="dark"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            hint="Awaiting payment"
            tone="yellow"
          />
          <StatCard
            title="Partial"
            value={stats.partial}
            hint="Partially paid groups"
            tone="blue"
          />
          <StatCard
            title="Paid"
            value={stats.paid}
            hint="Fully paid bookings"
            tone="green"
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmed}
            hint="Confirmed reservations"
            tone="default"
          />
          <StatCard
            title="Revenue"
            value={totals ? formatINR(totals.totalRevenue) : "—"}
            hint="Selected date range"
            tone="default"
          />
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            Loading dashboard...
          </div>
        )}

        {/* Analytics Section */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] lg:col-span-2 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xl font-bold text-slate-900">
                  Revenue Trend
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Daily revenue overview for the selected range
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {totals ? `${totals.totalBookings} bookings` : "No totals yet"}
              </div>
            </div>

            <div className="mt-5 h-72">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  No trend data available for this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="text-xl font-bold text-slate-900">Top Listings</div>
            <div className="mt-1 text-sm text-slate-500">
              Highest revenue performers
            </div>

            <div className="mt-5 space-y-3">
              {(analytics?.topListings || []).length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No listing performance data yet
                </div>
              ) : (
                (analytics?.topListings || []).map((l) => (
                  <div
                    key={String(l.listingId)}
                    className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="line-clamp-1 text-sm font-semibold text-slate-900">
                      {l.title}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {l.locationText}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Bookings:{" "}
                        <span className="font-semibold text-slate-900">
                          {l.bookings}
                        </span>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900">
                        {formatINR(l.revenue)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Booking Management
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, sort and filter your incoming bookings
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listing / guest / booking id / group id"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black sm:w-80"
              />

              <select
                value={payFilter}
                onChange={(e) => setPayFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="all">All payments</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid / Confirmed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="latest">Sort: Latest</option>
                <option value="amount">Sort: Highest amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="mt-6 space-y-5">
          {filteredBookings.map((b) => {
            const listing =
              b.listingId && typeof b.listingId === "object"
                ? b.listingId
                : null;

            const title = listing?.title || "Listing";
            const location = listing?.locationText || "";

            const { paid, total, pct } = computeProgress(b);
            const label = statusLabel(b);

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
                        <h3 className="line-clamp-1 text-xl font-bold text-slate-900">
                          {title}
                        </h3>
                        <StatusPill label={label} />
                      </div>

                      {location && (
                        <div className="mt-2 line-clamp-1 text-sm text-slate-500">
                          {location}
                        </div>
                      )}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Guest
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {b?.guestId?.name || b?.guestId?.email || "—"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Stay
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {new Date(b.checkIn).toLocaleDateString()} -{" "}
                            {new Date(b.checkOut).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Booking Info
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-800">
                            {b.guests} guests • {b.nights} nights
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                            Total Amount
                          </div>
                          <div className="mt-1 text-sm font-semibold">
                            {formatINR(b.totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-[200px] rounded-[24px] border border-slate-200 bg-white p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Booking Details
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
                              Group ID:
                            </span>{" "}
                            <span className="font-mono text-xs">
                              {b.groupId}
                            </span>
                          </div>
                        )}

                        <div>
                          <span className="font-medium text-slate-800">
                            Created:
                          </span>{" "}
                          {new Date(b.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-6">
                  {total > 0 && (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <ProgressBar pct={pct} />

                      <div className="mt-3 text-xs text-slate-500">
                        Paid members: <b className="text-slate-800">{paid}</b> /{" "}
                        <b className="text-slate-800">{total}</b>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {b.groupId && (
                      <Link
                        className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        to={`/join/${b.groupId}`}
                      >
                        Open Join Page
                      </Link>
                    )}

                    <Link
                      to={`/chat/${b._id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Open Chat
                    </Link>

                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={loadAll}
                    >
                      Refresh
                    </button>
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

          {!loading && filteredBookings.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
              <div className="text-xl font-semibold text-slate-900">
                No bookings match your filters
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your search text, payment filter, or sorting
                option.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setPayFilter("all");
                  setSortBy("latest");
                }}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
