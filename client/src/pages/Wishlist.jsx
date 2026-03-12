import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyWishlist, toggleWishlist } from "../api/wishlist";
import { addToCompare, getCompareItems } from "../utils/compare";

function StatCard({ title, value, hint, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
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

function WishlistCard({ l, onRemove, onCompare }) {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
      <Link to={`/listing/${l._id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
          {l.images?.[0] ? (
            <img
              src={l.images[0]}
              alt={l.title}
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
        <div className="min-w-0">
          <div className="line-clamp-1 text-lg font-semibold text-slate-900">
            {l.title}
          </div>
          <div className="mt-1 line-clamp-1 text-sm text-slate-500">
            {l.locationText}
          </div>
        </div>

        {l.description && (
          <div className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {l.description}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
            ₹{l.priceBase}/night
          </div>

          <div className="text-xs text-slate-500">
            {l.maxGuests ? `Up to ${l.maxGuests} guests` : "Saved stay"}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Link
            to={`/listing/${l._id}`}
            className="flex-1 rounded-2xl bg-black px-4 py-2.5 text-center text-sm font-medium text-white transition hover:opacity-90"
          >
            View Stay
          </Link>

          <button
            onClick={() => onCompare(l)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Compare
          </button>

          <button
            onClick={() => onRemove(l._id)}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [compareCount, setCompareCount] = useState(0);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await getMyWishlist();
      setListings(res.data.listings || []);
      setCompareCount(getCompareItems().length);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(listingId) {
    try {
      await toggleWishlist(listingId);
      setListings((prev) => prev.filter((item) => item._id !== listingId));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update wishlist");
    }
  }

  function handleCompare(listing) {
    const res = addToCompare(listing);

    if (!res.ok) {
      alert(res.message);
      setCompareCount(getCompareItems().length);
      return;
    }

    setCompareCount(res.items.length);
    alert("Added to compare successfully");
    navigate("/compare");
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: listings.length,
      avgPrice:
        listings.length > 0
          ? Math.round(
              listings.reduce((sum, item) => sum + Number(item.priceBase || 0), 0) /
                listings.length,
            )
          : 0,
    };
  }, [listings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-red-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>❤️ Saved collection</span>
                <span className="text-white/30">•</span>
                <span>Your favorite stays in one place</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Saved Stays
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Keep track of properties you love, compare them later, and book
                when you’re ready.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💖 Favorites
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📍 Trip planning
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🏡 Ready to revisit
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={load}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Refresh Wishlist
              </button>

              <Link
                to="/compare"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Compare ({compareCount})
              </Link>

              <Link
                to="/"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Explore More
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Saved Stays"
            value={stats.total}
            hint="Properties in your wishlist"
            tone="dark"
          />
          <StatCard
            title="Average Price"
            value={stats.total > 0 ? `₹${stats.avgPrice}` : "₹0"}
            hint="Average nightly saved price"
            tone="default"
          />
          <StatCard
            title="Ready to Compare"
            value={compareCount}
            hint="Listings currently in compare"
            tone="red"
          />
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            Loading wishlist...
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
            <div className="text-xl font-semibold text-slate-900">
              No saved stays yet
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Start exploring and save the stays you want to revisit later.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Explore stays
              </Link>

              <Link
                to="/bookings"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                My Bookings
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {listings.map((l) => (
              <WishlistCard
                key={l._id}
                l={l}
                onRemove={handleToggle}
                onCompare={handleCompare}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}