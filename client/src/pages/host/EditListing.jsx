import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import api from "../../api/axios";
import {
  getListingBlockedRanges,
  addListingBlockedRange,
  deleteListingBlockedRange,
} from "../../api/listings";

const AMENITIES = ["wifi", "parking", "ac", "kitchen", "pool"];

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function formatDateRange(startDate, endDate) {
  return `${new Date(startDate).toLocaleDateString()} - ${new Date(
    endDate,
  ).toLocaleDateString()}`;
}

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    title: "",
    description: "",
    locationText: "",
    lat: "",
    lng: "",
    priceBase: "",
    maxGuests: 2,
    images: [""],
    amenities: [],
    rules: [""],
    ecoTags: [""],
    status: "active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [blockedRanges, setBlockedRanges] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [deletingRangeId, setDeletingRangeId] = useState("");
  const [availabilityErr, setAvailabilityErr] = useState("");
  const [availabilityMsg, setAvailabilityMsg] = useState("");

  const [blockForm, setBlockForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateBlockField(name, value) {
    setBlockForm((prev) => ({ ...prev, [name]: value }));
  }

  async function loadBlockedRanges() {
    setAvailabilityErr("");
    try {
      setBlockedLoading(true);
      const res = await getListingBlockedRanges(id);
      setBlockedRanges(res.data.blockedRanges || []);
    } catch (e) {
      setAvailabilityErr(
        e.response?.data?.message || "Failed to load blocked ranges",
      );
    } finally {
      setBlockedLoading(false);
    }
  }

  async function handleAddBlockedRange(e) {
    if (e?.preventDefault) e.preventDefault();

    setAvailabilityErr("");
    setAvailabilityMsg("");

    if (!blockForm.startDate || !blockForm.endDate) {
      setAvailabilityErr("Please select both start and end dates");
      return;
    }

    try {
      setBlocking(true);

      const res = await addListingBlockedRange(id, {
        startDate: blockForm.startDate,
        endDate: blockForm.endDate,
        reason: blockForm.reason.trim(),
      });

      setBlockedRanges(res.data.blockedRanges || []);
      setAvailabilityMsg("Blocked range added successfully");
      setBlockForm({
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (e2) {
      setAvailabilityErr(
        e2.response?.data?.message || "Failed to add blocked range",
      );
    } finally {
      setBlocking(false);
    }
  }

  async function handleDeleteBlockedRange(rangeId) {
    const ok = window.confirm(
      "Are you sure you want to remove this blocked date range?",
    );

    if (!ok) return;

    setAvailabilityErr("");
    setAvailabilityMsg("");

    try {
      setDeletingRangeId(rangeId);
      const res = await deleteListingBlockedRange(id, rangeId);
      setBlockedRanges(res.data.blockedRanges || []);
      setAvailabilityMsg("Blocked range removed successfully");
    } catch (e) {
      setAvailabilityErr(
        e.response?.data?.message || "Failed to remove blocked range",
      );
    } finally {
      setDeletingRangeId("");
    }
  }

  function updateArrayField(name, index, value) {
    setForm((prev) => {
      const arr = [...prev[name]];
      arr[index] = value;
      return { ...prev, [name]: arr };
    });
  }

  function addArrayField(name) {
    setForm((prev) => ({ ...prev, [name]: [...prev[name], ""] }));
  }

  function removeArrayField(name, index) {
    setForm((prev) => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index),
    }));
  }

  function toggleAmenity(value) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter((a) => a !== value)
        : [...prev.amenities, value],
    }));
  }

  async function loadListing() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get(`/listings/${id}`);
      const l = res.data.listing;

      setForm({
        title: l.title || "",
        description: l.description || "",
        locationText: l.locationText || "",
        lat: l.lat ?? "",
        lng: l.lng ?? "",
        priceBase: l.priceBase ?? "",
        maxGuests: l.maxGuests ?? 2,
        images: l.images?.length ? l.images : [""],
        amenities: l.amenities || [],
        rules: l.rules?.length ? l.rules : [""],
        ecoTags: l.ecoTags?.length ? l.ecoTags : [""],
        status: l.status || "active",
      });
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        priceBase: Number(form.priceBase),
        maxGuests: Number(form.maxGuests),
        lat: Number(form.lat),
        lng: Number(form.lng),
        images: form.images.map((x) => x.trim()).filter(Boolean),
        rules: form.rules.map((x) => x.trim()).filter(Boolean),
        ecoTags: form.ecoTags.map((x) => x.trim()).filter(Boolean),
      };

      await api.put(`/listings/${id}`, payload);
      navigate("/host/listings");
    } catch (e2) {
      setErr(e2.response?.data?.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadListing();
    loadBlockedRanges();
  }, [id]);

  useEffect(() => {
    if (location.hash !== "#availability-manager") return;

    const timer = setTimeout(() => {
      const el = document.getElementById("availability-manager");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [location.hash, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-6 text-slate-600 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          Loading listing...
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>✏️ Update your listing</span>
                <span className="text-white/30">•</span>
                <span>Host editing panel</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Edit Listing
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Refine property details, adjust pricing, manage amenities, and
                keep your listing updated with a clean premium host experience.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🏡 Property details
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📷 Image URLs
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🌿 Eco tags & rules
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/host/listings"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Back to Listings
              </Link>

              <a
                href="#availability-manager"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Availability Manager
              </a>

              <Link
                to={`/listing/${id}`}
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Preview Listing
              </Link>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <SectionCard
            title="Basic Information"
            subtitle="Update title, description, location and hosting essentials"
          >
            <div className="grid gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Listing Title
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  className="mt-2 min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.locationText}
                    onChange={(e) =>
                      updateField("locationText", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="blocked">blocked</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.lat}
                    onChange={(e) => updateField("lat", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.lng}
                    onChange={(e) => updateField("lng", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Price / night
                  </label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.priceBase}
                    onChange={(e) => updateField("priceBase", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.maxGuests}
                    onChange={(e) => updateField("maxGuests", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <div id="availability-manager" className="scroll-mt-28">
            <SectionCard
              title="Availability Manager"
              subtitle="Block dates for maintenance, personal use, festivals, or temporary unavailability"
            >
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Start Date
                        </label>
                        <input
                          type="date"
                          min={todayStr}
                          value={blockForm.startDate}
                          onChange={(e) =>
                            updateBlockField("startDate", e.target.value)
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          End Date
                        </label>
                        <input
                          type="date"
                          min={blockForm.startDate || todayStr}
                          value={blockForm.endDate}
                          onChange={(e) =>
                            updateBlockField("endDate", e.target.value)
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={blockForm.reason}
                        onChange={(e) =>
                          updateBlockField("reason", e.target.value)
                        }
                        placeholder="Example: Maintenance, Personal stay, Festival closure"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleAddBlockedRange}
                        disabled={blocking}
                        className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        {blocking ? "Blocking..." : "Add Blocked Range"}
                      </button>

                      <button
                        type="button"
                        onClick={loadBlockedRanges}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Refresh Dates
                      </button>
                    </div>

                    {availabilityErr && (
                      <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                        {availabilityErr}
                      </div>
                    )}

                    {availabilityMsg && (
                      <div className="rounded-2xl bg-green-50 p-3 text-sm text-green-700">
                        {availabilityMsg}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Current Blocked Dates
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          These dates will be unavailable to guests
                        </p>
                      </div>

                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {blockedRanges.length} range
                        {blockedRanges.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {blockedLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                          Loading blocked ranges...
                        </div>
                      ) : blockedRanges.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                          <div className="text-base font-semibold text-slate-800">
                            No blocked dates yet
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            Add a blocked range to prevent guests from booking
                            on unavailable dates.
                          </p>
                        </div>
                      ) : (
                        blockedRanges.map((range) => (
                          <div
                            key={range._id}
                            className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {formatDateRange(
                                    range.startDate,
                                    range.endDate,
                                  )}
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {range.reason?.trim()
                                    ? range.reason
                                    : "No reason added"}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteBlockedRange(range._id)
                                }
                                disabled={deletingRangeId === range._id}
                                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                {deletingRangeId === range._id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Amenities"
            subtitle="Highlight comfort and stay experience with available features"
          >
            <div className="flex flex-wrap gap-3">
              {AMENITIES.map((item) => {
                const active = form.amenities.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleAmenity(item)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionCard
                title="Images"
                subtitle="Manage listing image URLs and keep your gallery updated"
              >
                <div className="space-y-3">
                  {form.images.map((img, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                        value={img}
                        onChange={(e) =>
                          updateArrayField("images", index, e.target.value)
                        }
                        placeholder="Image URL"
                      />
                      {form.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField("images", index)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayField("images")}
                  className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  + Add image
                </button>
              </SectionCard>
            </div>

            <div>
              <SectionCard
                title="Quick Tips"
                subtitle="Small changes can improve guest trust"
              >
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Use a clear and descriptive title.
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Keep pricing realistic for your location.
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Add multiple images for better conversions.
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Mention strong amenities and eco features.
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <SectionCard
              title="House Rules"
              subtitle="Add stay rules that guests must follow"
            >
              <div className="space-y-3">
                {form.rules.map((rule, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                      value={rule}
                      onChange={(e) =>
                        updateArrayField("rules", index, e.target.value)
                      }
                      placeholder="Rule"
                    />
                    {form.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField("rules", index)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addArrayField("rules")}
                className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                + Add rule
              </button>
            </SectionCard>

            <SectionCard
              title="Eco Tags"
              subtitle="Show sustainability features to eco-conscious guests"
            >
              <div className="space-y-3">
                {form.ecoTags.map((tag, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                      value={tag}
                      onChange={(e) =>
                        updateArrayField("ecoTags", index, e.target.value)
                      }
                      placeholder="Eco tag"
                    />
                    {form.ecoTags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField("ecoTags", index)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addArrayField("ecoTags")}
                className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                + Add eco tag
              </button>
            </SectionCard>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Save your listing changes
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review updates and save when you’re ready.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <Link
                  to="/host/listings"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
