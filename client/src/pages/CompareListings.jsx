import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCompareItems,
  removeFromCompare,
  clearCompare,
} from "../utils/compare";

function formatBool(v) {
  return v ? "Yes" : "No";
}

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

function FieldRow({ label, items, renderValue }) {
  return (
    <div className="grid min-w-[900px] grid-cols-[220px_repeat(var(--cols),minmax(260px,1fr))] border-b border-slate-200 last:border-b-0">
      <div className="bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-800">
        {label}
      </div>

      {items.map((item) => (
        <div key={`${label}-${item._id}`} className="px-5 py-4 text-sm text-slate-700">
          {renderValue(item)}
        </div>
      ))}
    </div>
  );
}

export default function CompareListings() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getCompareItems());
  }, []);

  function handleRemove(id) {
    const next = removeFromCompare(id);
    setItems(next);
  }

  function handleClear() {
    clearCompare();
    setItems([]);
  }

  const stats = useMemo(() => {
    if (items.length === 0) {
      return {
        total: 0,
        cheapest: 0,
        maxGuests: 0,
      };
    }

    return {
      total: items.length,
      cheapest: Math.min(...items.map((i) => Number(i.priceBase || 0))),
      maxGuests: Math.max(...items.map((i) => Number(i.maxGuests || 0))),
    };
  }, [items]);

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
                <span>⚖️ Stay comparison</span>
                <span className="text-white/30">•</span>
                <span>Compare side by side</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Compare Listings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                View pricing, guests, amenities, eco features and safety details
                side by side to choose the best stay faster.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💸 Price check
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🛏 Guest capacity
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🛡 Safety features
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleClear}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Clear All
              </button>

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
            title="Compared Stays"
            value={stats.total}
            hint="Listings currently in compare"
            tone="dark"
          />
          <StatCard
            title="Cheapest Night"
            value={stats.cheapest ? `₹${stats.cheapest}` : "₹0"}
            hint="Lowest nightly starting price"
            tone="default"
          />
          <StatCard
            title="Highest Capacity"
            value={stats.maxGuests}
            hint="Max guests among compared stays"
            tone="blue"
          />
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
            <div className="text-xl font-semibold text-slate-900">
              No listings selected for comparison
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Add stays from wishlist or listing cards to compare them here.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/wishlist"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open Wishlist
              </Link>

              <Link
                to="/"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Browse Stays
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Top cards */}
            <div className="mt-8 overflow-x-auto">
              <div
                className="grid min-w-[900px] gap-4"
                style={{ gridTemplateColumns: `repeat(${items.length}, minmax(260px, 1fr))` }}
              >
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="line-clamp-1 text-lg font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {item.locationText}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
                          ₹{item.priceBase}/night
                        </div>

                        <button
                          onClick={() => handleRemove(item._id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4">
                        <Link
                          to={`/listing/${item._id}`}
                          className="inline-flex rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compare table */}
            <div className="mt-8 overflow-x-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <div
                style={{ "--cols": items.length }}
                className="min-w-[900px]"
              >
                <FieldRow
                  label="Price / night"
                  items={items}
                  renderValue={(item) => (
                    <span className="font-semibold text-slate-900">
                      ₹{item.priceBase}
                    </span>
                  )}
                />

                <FieldRow
                  label="Max Guests"
                  items={items}
                  renderValue={(item) => item.maxGuests || "—"}
                />

                <FieldRow
                  label="Amenities"
                  items={items}
                  renderValue={(item) =>
                    item.amenities?.length ? item.amenities.join(", ") : "—"
                  }
                />

                <FieldRow
                  label="Eco Tags"
                  items={items}
                  renderValue={(item) =>
                    item.ecoTags?.length ? item.ecoTags.join(", ") : "—"
                  }
                />

                <FieldRow
                  label="CCTV"
                  items={items}
                  renderValue={(item) => formatBool(item.safetyFeatures?.cctv)}
                />

                <FieldRow
                  label="Guard"
                  items={items}
                  renderValue={(item) => formatBool(item.safetyFeatures?.guard)}
                />

                <FieldRow
                  label="First Aid"
                  items={items}
                  renderValue={(item) =>
                    formatBool(item.safetyFeatures?.firstAid)
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}