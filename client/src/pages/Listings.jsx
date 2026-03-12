import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllListings } from "../api/listings";
import { addToCompare, getCompareItems } from "../utils/compare";
import ListingsMap from "../components/ListingsMap";
import { getStayBadges } from "../utils/recommend";

function StatCard({ title, value, hint, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
    blue: "bg-blue-50 border-blue-200",
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

function ListingCard({ l, onCompare }) {
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
        <div className="line-clamp-1 text-lg font-semibold text-slate-900">
          {l.title}
        </div>

        <div className="mt-1 line-clamp-1 text-sm text-slate-500">
          {l.locationText}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {getStayBadges(l).map((b, i) => (
            <span
              key={i}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
            >
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
            ₹{l.priceBase} / night
          </div>

          <div className="text-xs text-slate-500">
            {l.maxGuests ? `Max ${l.maxGuests} guests` : "Stay"}
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
            type="button"
            onClick={() => onCompare(l)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const [compareCount, setCompareCount] = useState(0);
  const [viewMode, setViewMode] = useState("grid");

  async function loadListings() {
    setErr("");
    setLoading(true);

    try {
      const res = await getAllListings();
      setListings(res.data.listings || []);
      setCompareCount(getCompareItems().length);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  function handleAddToCompare(listing) {
    const result = addToCompare(listing);

    if (!result.ok) {
      setErr(result.message);
      setCompareCount(getCompareItems().length);
      return;
    }

    setCompareCount(result.items.length);
  }

  const filteredListings = useMemo(() => {
    let data = [...listings];
    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter((l) => {
        const title = l.title?.toLowerCase() || "";
        const location = l.locationText?.toLowerCase() || "";
        const desc = l.description?.toLowerCase() || "";
        return title.includes(q) || location.includes(q) || desc.includes(q);
      });
    }

    if (guests) {
      data = data.filter((l) => Number(l.maxGuests) >= Number(guests));
    }

    if (minPrice) {
      data = data.filter((l) => Number(l.priceBase) >= Number(minPrice));
    }

    if (maxPrice) {
      data = data.filter((l) => Number(l.priceBase) <= Number(maxPrice));
    }

    if (sortBy === "price_asc") {
      data.sort((a, b) => Number(a.priceBase) - Number(b.priceBase));
    } else if (sortBy === "price_desc") {
      data.sort((a, b) => Number(b.priceBase) - Number(a.priceBase));
    } else if (sortBy === "guests_desc") {
      data.sort((a, b) => Number(b.maxGuests) - Number(a.maxGuests));
    } else {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return data;
  }, [listings, search, guests, minPrice, maxPrice, sortBy]);

  function resetFilters() {
    setSearch("");
    setGuests("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("latest");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>🔎 Explore premium stays</span>
                <span className="text-white/30">•</span>
                <span>Find your next perfect trip</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Explore Stays
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Search, filter, compare and discover premium places that match
                your budget, guest count and travel style.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🏡 Curated stays
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ⚖️ Compare listings
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🗺 Map view
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/compare"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Compare ({compareCount})
              </Link>

              <button
                onClick={loadListings}
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Available Stays"
            value={listings.length}
            hint="All published listings"
            tone="dark"
          />
          <StatCard
            title="Filtered Results"
            value={filteredListings.length}
            hint="Listings matching your search"
            tone="default"
          />
          <StatCard
            title="Compare Queue"
            value={compareCount}
            hint="Listings ready to compare"
            tone="blue"
          />
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Filters */}
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Search & Filters
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Narrow down stays based on your travel preferences
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  viewMode === "grid"
                    ? "bg-black text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Grid
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  viewMode === "map"
                    ? "bg-black text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Map
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="text"
              placeholder="Search city, title, description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black"
            />

            <input
              type="number"
              placeholder="Guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black"
            />

            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black"
            />

            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black"
            >
              <option value="latest">Sort: Latest</option>
              <option value="price_asc">Price Low → High</option>
              <option value="price_desc">Price High → Low</option>
              <option value="guests_desc">Max Guests</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={loadListings}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Refresh
            </button>

            <button
              onClick={resetFilters}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Listings */}
        <div className="mt-8">
          {loading ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              Loading listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
              <div className="text-xl font-semibold text-slate-900">
                No listings found
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search, guests, or price filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredListings.map((l) => (
                <ListingCard
                  key={l._id}
                  l={l}
                  onCompare={handleAddToCompare}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <ListingsMap listings={filteredListings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}