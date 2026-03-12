import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicListings } from "../api/listings";
import { getTrendingListings } from "../api/trending";
import { haversineDistance } from "../utils/distance";
import { getPlannerRecommendations } from "../utils/planner";

const quickCategories = [
  { label: "Beach", query: "beach", icon: "🏖️" },
  { label: "Mountains", query: "mountain", icon: "🏔️" },
  { label: "City", query: "city", icon: "🌆" },
  { label: "Eco", query: "eco", icon: "🌿" },
  { label: "Luxury", query: "luxury", icon: "✨" },
  { label: "Workation", query: "workation", icon: "💻" },
];

const featureCards = [
  {
    icon: "✨",
    title: "Smart Discovery",
    desc: "Find stays by vibe, budget, guest count and curated travel intent.",
  },
  {
    icon: "💳",
    title: "Split Payments",
    desc: "Travel with friends and let everyone pay their share smoothly.",
  },
  {
    icon: "📍",
    title: "Nearby Stays",
    desc: "Discover premium homes around your current location instantly.",
  },
  {
    icon: "❤️",
    title: "Wishlist & Compare",
    desc: "Save favorites and compare top properties before you decide.",
  },
];

function buildParams({ q, guests, ecoTags, minPrice, maxPrice }) {
  const p = {};
  if (q) p.q = q;
  if (guests) p.guests = guests;
  if (ecoTags) p.ecoTags = ecoTags;
  if (minPrice) p.minPrice = minPrice;
  if (maxPrice) p.maxPrice = maxPrice;
  return p;
}

function ListingCard({ l, extraInfo }) {
  return (
    <Link
      to={`/listing/${l._id}`}
      className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
    >
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

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="line-clamp-1 text-base font-semibold text-slate-900 sm:text-lg">
              {l.title}
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-slate-500">
              {l.locationText}
            </div>
          </div>

          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
            ₹{l.priceBase}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Max guests: {l.maxGuests}</span>
          {extraInfo ? (
            <span className="line-clamp-1 max-w-[45%] text-right">
              {extraInfo}
            </span>
          ) : l.ecoTags?.length ? (
            <span className="line-clamp-1 max-w-[45%] text-right">
              Eco: {l.ecoTags.join(", ")}
            </span>
          ) : (
            <span>Verified stay</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState(2);
  const [ecoTags, setEcoTags] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [listings, setListings] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [trending, setTrending] = useState([]);

  const [userLocation, setUserLocation] = useState(null);
  const [nearbyListings, setNearbyListings] = useState([]);
  const [locationErr, setLocationErr] = useState("");

  const [planner, setPlanner] = useState({
    city: "",
    guests: 2,
    budget: "",
    vibe: "",
  });

  const [plannerResults, setPlannerResults] = useState([]);

  const resultsRef = useRef(null);
  const bestMatchesRef = useRef(null);

  const currentParams = useMemo(
    () => buildParams({ q, guests, ecoTags, minPrice, maxPrice }),
    [q, guests, ecoTags, minPrice, maxPrice],
  );

  useEffect(() => {
    async function loadTrending() {
      try {
        const res = await getTrendingListings();
        setTrending(res.data.listings || []);
      } catch {
        setTrending([]);
      }
    }

    loadTrending();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationErr("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationErr("Location access denied");
      },
    );
  }, []);

  useEffect(() => {
    if (!userLocation || !Array.isArray(listings) || listings.length === 0) {
      setNearbyListings([]);
      return;
    }

    const withDistance = listings
      .filter(
        (l) =>
          typeof l.lat === "number" &&
          typeof l.lng === "number" &&
          !Number.isNaN(l.lat) &&
          !Number.isNaN(l.lng),
      )
      .map((l) => ({
        ...l,
        distanceKm: haversineDistance(
          userLocation.lat,
          userLocation.lng,
          l.lat,
          l.lng,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);

    setNearbyListings(withDistance);
  }, [userLocation, listings]);

  async function load(scrollToResults = false, customParams = currentParams) {
    setErr("");
    setLoading(true);

    try {
      const res = await getPublicListings(customParams);
      setListings(res.data.listings || []);

      if (scrollToResults) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 150);
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  function handleRunPlanner() {
    const results = getPlannerRecommendations(listings, planner);
    setPlannerResults(results);

    setTimeout(() => {
      if (results.length > 0) {
        bestMatchesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 120);
  }

  function applyQuickCategory(category) {
    const nextState = {
      q: category.query,
      guests,
      ecoTags,
      minPrice,
      maxPrice,
    };

    setQ(category.query);
    load(true, buildParams(nextState));
  }

  function applyQuickFilter(type) {
    let nextState = {
      q,
      guests,
      ecoTags,
      minPrice,
      maxPrice,
    };

    if (type === "budget") {
      nextState = { ...nextState, maxPrice: "3000", minPrice: "" };
      setMaxPrice("3000");
      setMinPrice("");
    } else if (type === "luxury") {
      nextState = { ...nextState, minPrice: "8000", maxPrice: "" };
      setMinPrice("8000");
      setMaxPrice("");
    } else if (type === "eco") {
      nextState = { ...nextState, ecoTags: "solar,recycling" };
      setEcoTags("solar,recycling");
    } else if (type === "family") {
      nextState = { ...nextState, guests: 4 };
      setGuests(4);
    } else if (type === "couple") {
      nextState = { ...nextState, guests: 2 };
      setGuests(2);
    } else if (type === "workation") {
      nextState = { ...nextState, q: "workation" };
      setQ("workation");
    }

    load(true, buildParams(nextState));
  }

  function clearAllFilters() {
    setQ("");
    setGuests(2);
    setEcoTags("");
    setMinPrice("");
    setMaxPrice("");
    setPlannerResults([]);

    const resetParams = buildParams({
      q: "",
      guests: 2,
      ecoTags: "",
      minPrice: "",
      maxPrice: "",
    });

    load(true, resetParams);
  }

  useEffect(() => {
    load(false, currentParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-1/4 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-[1] grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>✨ Premium stays</span>
                <span className="text-white/30">•</span>
                <span>Smarter booking experience</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Stay smarter, travel better, book beautifully.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Discover premium homes, compare stays, plan trips with friends,
                and find places that match your vibe with StaySmart.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💳 Split payments
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📍 Nearby stays
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ❤️ Wishlist & compare
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  ✨ Smart planner
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">Premium</div>
                  <div className="mt-1 text-sm text-white/65">
                    Curated stay experience
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">Nearby</div>
                  <div className="mt-1 text-sm text-white/65">
                    Location-aware discovery
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">Smarter</div>
                  <div className="mt-1 text-sm text-white/65">
                    Better trip planning flow
                  </div>
                </div>
              </div>
            </div>

            {/* Search panel */}
            <div className="rounded-[30px] border border-white/10 bg-white/10 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-5">
              <div className="rounded-[26px] border border-white/10 bg-white p-4 text-slate-900 sm:p-5">
                <div className="text-lg font-bold sm:text-xl">
                  Start your next stay search
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Search by location, guests, eco preference and budget.
                </p>

                <div className="mt-5 grid gap-3">
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none shadow-sm focus:border-black focus:ring-2 focus:ring-black/80"
                    placeholder="Search city / area (e.g., Goa)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none shadow-sm focus:border-black focus:ring-2 focus:ring-black/80"
                      type="number"
                      min={1}
                      placeholder="Guests"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none shadow-sm focus:border-black focus:ring-2 focus:ring-black/80"
                      placeholder="Eco tags (solar,recycling)"
                      value={ecoTags}
                      onChange={(e) => setEcoTags(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none shadow-sm focus:border-black focus:ring-2 focus:ring-black/80"
                      type="number"
                      placeholder="Min price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none shadow-sm focus:border-black focus:ring-2 focus:ring-black/80"
                      type="number"
                      placeholder="Max price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={() => load(true)}
                    disabled={loading}
                    className="rounded-2xl bg-slate-900 px-5 py-3.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Searching..." : "Search stays"}
                  </button>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Quick filters
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => applyQuickFilter("budget")}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Budget
                    </button>
                    <button
                      onClick={() => applyQuickFilter("luxury")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Luxury
                    </button>
                    <button
                      onClick={() => applyQuickFilter("eco")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Eco
                    </button>
                    <button
                      onClick={() => applyQuickFilter("family")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Family
                    </button>
                    <button
                      onClick={() => applyQuickFilter("couple")}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Couple
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY STRIP */}
        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Explore by vibe
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump into the kind of stay you want faster
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {quickCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => applyQuickCategory(cat)}
                className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="text-2xl">{cat.icon}</div>
                <div className="mt-4 text-base font-semibold text-slate-900">
                  {cat.label}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Explore {cat.label.toLowerCase()} stays
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* WHY STAYSMART */}
        <section className="mt-14">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Why StaySmart
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                More than a booking app — a smarter stay experience
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((item) => (
              <div
                key={item.title}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="mt-4 text-lg font-semibold text-slate-900">
                  {item.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SMART PLANNER */}
        <section className="mt-14 rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                ✨ Smart Travel Planner
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Get curated stay suggestions based on city, budget, guests and
                travel vibe.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 sm:text-sm">
              AI-style matching experience
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-black focus:ring-2 focus:ring-black"
              placeholder="City"
              value={planner.city}
              onChange={(e) =>
                setPlanner((prev) => ({ ...prev, city: e.target.value }))
              }
            />

            <input
              className="rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-black focus:ring-2 focus:ring-black"
              type="number"
              min={1}
              placeholder="Guests"
              value={planner.guests}
              onChange={(e) =>
                setPlanner((prev) => ({ ...prev, guests: e.target.value }))
              }
            />

            <input
              className="rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-black focus:ring-2 focus:ring-black"
              type="number"
              placeholder="Budget / night"
              value={planner.budget}
              onChange={(e) =>
                setPlanner((prev) => ({ ...prev, budget: e.target.value }))
              }
            />

            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-black focus:ring-2 focus:ring-black"
              value={planner.vibe}
              onChange={(e) =>
                setPlanner((prev) => ({ ...prev, vibe: e.target.value }))
              }
            >
              <option value="">Select vibe</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
              <option value="workation">Workation</option>
              <option value="eco">Eco</option>
              <option value="luxury">Luxury</option>
              <option value="budget">Budget</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunPlanner}
              className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:opacity-90"
            >
              Find Best Matches
            </button>

            <p className="text-sm text-slate-500">
              Personalized recommendations for a more premium booking experience
            </p>
          </div>
        </section>

        {plannerResults.length > 0 && (
          <section
            ref={bestMatchesRef}
            id="best-matches"
            className="mt-12 rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  🎯 Best Matches For Your Trip
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Smart recommendations based on your planner inputs
                </p>
              </div>

              <div className="text-sm text-slate-500">
                {plannerResults.length} personalized picks
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {plannerResults.map((l) => (
                <Link
                  key={l._id}
                  to={`/listing/${l._id}`}
                  className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {l.images?.[0] ? (
                      <img
                        src={l.images[0]}
                        alt={l.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="line-clamp-1 text-base font-semibold text-slate-900 sm:text-lg">
                        {l.title}
                      </div>
                      <div className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                        {l.plannerScore} pts
                      </div>
                    </div>

                    <div className="mt-1 line-clamp-1 text-sm text-slate-600">
                      {l.locationText}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {l.plannerReasons?.map((reason, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
                        ₹{l.priceBase}/night
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* TRENDING */}
        <section className="mt-14 rounded-[30px] border border-slate-200 bg-white/80 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                🔥 Trending Stays
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Popular places guests are loving right now
              </p>
            </div>

            <div className="text-sm text-slate-500">
              Handpicked premium picks
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {trending.map((l) => (
              <ListingCard key={l._id} l={l} />
            ))}
          </div>
        </section>

        {locationErr && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            {locationErr}
          </div>
        )}

        {/* NEARBY */}
        {nearbyListings.length > 0 && (
          <section className="mt-14 rounded-[30px] border border-slate-200 bg-white/80 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  📍 Stays Near You
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Closest places based on your current location
                </p>
              </div>

              <div className="text-sm text-slate-500">
                Quick nearby discoveries
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {nearbyListings.map((l) => (
                <ListingCard
                  key={l._id}
                  l={l}
                  extraInfo={`${l.distanceKm.toFixed(1)} km away`}
                />
              ))}
            </div>
          </section>
        )}

        {/* ERRORS */}
        {err && (
          <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* RESULTS */}
        <section
          ref={resultsRef}
          className="mt-14 rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Explore stays
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse places that match your current filters
              </p>
            </div>

            <div className="text-sm text-slate-600">
              {loading ? "Loading..." : `${listings.length} results`}
            </div>
          </div>

          {listings.length === 0 && !loading ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="text-lg font-semibold text-slate-800">
                No stays found
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your search, guest count, eco tags, or budget
                filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 pb-6 sm:grid-cols-2 xl:grid-cols-4">
              {listings.map((l) => (
                <ListingCard key={l._id} l={l} />
              ))}
            </div>
          )}
        </section>

        {/* FINAL CTA */}
        <section className="mt-14 overflow-hidden rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                <span>🚀 Ready for your next trip?</span>
              </div>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Plan smarter. Stay better.
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
                Explore premium stays, compare options, and book with confidence
                using StaySmart’s modern booking experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/listings"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Explore all stays
              </Link>

              <Link
                to="/register"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
