import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyListings, deleteListing } from "../../api/listings";
import useAuthStore from "../../store/authStore";

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blocked: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {status || "unknown"}
    </span>
  );
}

function StatCard({ title, value, hint, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
    green: "bg-emerald-50 border-emerald-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
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

function ListingCard({ listing, onDelete }) {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
      <Link to={`/listing/${listing._id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="line-clamp-1 text-base font-semibold text-slate-900 sm:text-lg">
              {listing.title}
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-slate-500">
              {listing.locationText}
            </div>
          </div>

          <StatusBadge status={listing.status} />
        </div>

        <div className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {listing.description || "No description added yet."}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
            ₹{listing.priceBase}/night
          </div>
          <div className="text-xs text-slate-500">
            Max {listing.maxGuests} guests
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Link
            to={`/listing/${listing._id}`}
            className="flex-1 rounded-2xl bg-black px-4 py-2.5 text-center text-sm font-medium text-white transition hover:opacity-90"
          >
            View
          </Link>

          <Link
            to={`/host/listings/edit/${listing._id}`}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={() => onDelete(listing._id, listing.title)}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostListings() {
  const [listings, setListings] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const user = useAuthStore((s) => s.user);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await getMyListings();
      setListings(res.data.listings || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteListing(listingId, title) {
    const ok = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`,
    );

    if (!ok) return;

    try {
      setErr("");
      await deleteListing(listingId);
      setListings((prev) => prev.filter((item) => item._id !== listingId));
      alert("Listing deleted successfully");
    } catch (e) {
      const message = e.response?.data?.message || "Failed to delete listing";
      setErr(message);
      alert(message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    let active = 0;
    let pending = 0;
    let blocked = 0;

    for (const l of listings) {
      if (l.status === "active") active++;
      else if (l.status === "pending") pending++;
      else if (l.status === "blocked") blocked++;
    }

    return {
      total: listings.length,
      active,
      pending,
      blocked,
    };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = [...listings];

    if (q) {
      data = data.filter((l) => {
        const title = l.title?.toLowerCase() || "";
        const location = l.locationText?.toLowerCase() || "";
        const desc = l.description?.toLowerCase() || "";
        return title.includes(q) || location.includes(q) || desc.includes(q);
      });
    }

    if (sortBy === "price_asc") {
      data.sort((a, b) => (a.priceBase || 0) - (b.priceBase || 0));
    } else if (sortBy === "price_desc") {
      data.sort((a, b) => (b.priceBase || 0) - (a.priceBase || 0));
    } else if (sortBy === "title_asc") {
      data.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return data;
  }, [listings, search, sortBy]);

  const hostName =
    user?.name || user?.fullName || user?.email?.split("@")[0] || "Host";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>🏡 Host listing control center</span>
                <span className="text-white/30">•</span>
                <span>Manage all your properties</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Welcome, {hostName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Create, edit, review and manage your listings with a polished
                hosting experience inspired by premium booking platforms.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ✨ Premium hosting
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📍 Property management
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ⚡ Quick actions
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/host/bookings"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                View Bookings
              </Link>

              <Link
                to="/host/reviews"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                View Reviews
              </Link>

              <Link
                to="/host/listings/new"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                + New Listing
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Listings"
            value={stats.total}
            hint="All hosted properties"
            tone="dark"
          />
          <StatCard
            title="Active"
            value={stats.active}
            hint="Live and visible to guests"
            tone="green"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            hint="Waiting for approval or review"
            tone="yellow"
          />
          <StatCard
            title="Blocked"
            value={stats.blocked}
            hint="Needs attention"
            tone="red"
          />
        </div>

        {/* Filter Bar */}
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Your Listings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, sort and manage your hosted properties
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search title / location / description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black sm:w-80"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="latest">Sort: Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="title_asc">Title A-Z</option>
              </select>

              <button
                onClick={load}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            Loading listings...
          </div>
        )}

        {!loading && filteredListings.length === 0 && !err && (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
            <div className="text-xl font-semibold text-slate-900">
              No listings found
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or create a new listing to get started.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/host/listings/new"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Create New Listing
              </Link>

              <button
                onClick={() => {
                  setSearch("");
                  setSortBy("latest");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Listing Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onDelete={handleDeleteListing}
            />
          ))}
        </div>
      </div>
    </div>
  );
}