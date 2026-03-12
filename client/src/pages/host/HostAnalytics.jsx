import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHostAnalytics } from "../../api/host";
import useAuthStore from "../../store/authStore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function StatCard({ title, value, hint, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
    green: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    purple: "bg-violet-50 border-violet-200",
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

export default function HostAnalytics() {
  const user = useAuthStore((s) => s.user);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [range, setRange] = useState(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  });

  async function loadAnalytics() {
    try {
      setLoading(true);
      setErr("");

      const res = await getHostAnalytics({
        from: range.from,
        to: range.to,
      });

      setAnalytics(res.data);
    } catch (e) {
      console.error("Failed to load host analytics", e);
      setErr(e.response?.data?.message || "Failed to load host analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [range.from, range.to]);

  const totals = analytics?.totals || {};
  const topListing = analytics?.topPerformingListing || null;

  const chartData = useMemo(() => {
    return (analytics?.trend || []).map((item) => ({
      date: shortDate(item.date),
      revenue: Number(item.revenue || 0),
      count: Number(item.count || 0),
    }));
  }, [analytics]);

  const welcomeName =
    user?.name || user?.fullName || user?.email?.split("@")[0] || "Host";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>📊 Host analytics dashboard</span>
                <span className="text-white/30">•</span>
                <span>Revenue, bookings & ratings insights</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Analytics overview, {welcomeName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Track your business performance with listings, bookings, revenue,
                ratings, and top-performing property insights from one premium
                dashboard.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💰 Revenue trend
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ⭐ Average rating
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🏡 Top property
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadAnalytics}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Refresh Analytics
              </button>

              <Link
                to="/host/bookings"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Host Bookings
              </Link>

              <Link
                to="/host/listings"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Manage Listings
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Analytics Range
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review booking and revenue performance for a selected period
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
                {loading ? "Updating analytics…" : "Analytics ready"}
              </div>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Listings"
            value={totals.totalListings || 0}
            hint="Your active hosting inventory"
            tone="dark"
          />
          <StatCard
            title="Total Bookings"
            value={totals.totalBookings || 0}
            hint="All bookings received"
            tone="blue"
          />
          <StatCard
            title="Confirmed Bookings"
            value={totals.confirmedBookings || 0}
            hint="Confirmed stays"
            tone="green"
          />
          <StatCard
            title="Pending Bookings"
            value={totals.pendingBookings || 0}
            hint="Awaiting completion"
            tone="yellow"
          />
          <StatCard
            title="Total Revenue"
            value={formatINR(totals.totalRevenue || 0)}
            hint="For selected date range"
            tone="default"
          />
          <StatCard
            title="Average Rating"
            value={totals.averageRating ? `${totals.averageRating}/5` : "—"}
            hint={`${totals.totalReviews || 0} total reviews`}
            tone="purple"
          />
          <StatCard
            title="Top Listing"
            value={topListing?.title || "—"}
            hint={
              topListing
                ? `${topListing.bookings} bookings • ${formatINR(topListing.revenue)}`
                : "No performance data yet"
            }
            tone="default"
          />
          <StatCard
            title="Top Listing Revenue"
            value={topListing ? formatINR(topListing.revenue) : "—"}
            hint={topListing?.locationText || "No top listing yet"}
            tone="default"
          />
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            Loading analytics...
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] lg:col-span-2 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xl font-bold text-slate-900">
                  Revenue Trend
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Revenue trend for the selected date range
                </div>
              </div>

              <div className="text-sm text-slate-500">
                {totals.totalBookings || 0} bookings
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
            <div className="text-xl font-bold text-slate-900">
              Top Performing Listing
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Best performer by revenue
            </div>

            {!topListing ? (
              <div className="mt-5 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No listing performance data yet
              </div>
            ) : (
              <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="line-clamp-1 text-base font-semibold text-slate-900">
                  {topListing.title}
                </div>

                <div className="mt-1 line-clamp-1 text-sm text-slate-500">
                  {topListing.locationText || "Location unavailable"}
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Bookings
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {topListing.bookings}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Revenue
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {formatINR(topListing.revenue)}
                    </div>
                  </div>
                </div>

                <Link
                  to="/host/listings"
                  className="mt-4 inline-flex rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Manage Listings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}