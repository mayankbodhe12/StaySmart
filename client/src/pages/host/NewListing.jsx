import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createListing, uploadListingImages } from "../../api/listings";

export default function NewListing() {
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    locationText: "",
    lat: 0,
    lng: 0,
    priceBase: 1000,
    maxGuests: 2,
    ecoTags: "",
    amenities: "",
    rules: "",
    safety_cctv: false,
    safety_wellLit: false,
  });

  const [files, setFiles] = useState([]);

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const selectedFileNames = useMemo(
    () => files.map((f) => f.name),
    [files],
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        locationText: form.locationText,
        lat: Number(form.lat),
        lng: Number(form.lng),
        priceBase: Number(form.priceBase),
        maxGuests: Number(form.maxGuests),
        ecoTags: form.ecoTags
          ? form.ecoTags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        amenities: form.amenities
          ? form.amenities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        rules: form.rules
          ? form.rules
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        safetyFeatures: {
          cctv: form.safety_cctv,
          wellLit: form.safety_wellLit,
        },
      };

      const res = await createListing(payload);
      const listingId = res.data.listing._id;

      try {
        if (files.length > 0) {
          await uploadListingImages(listingId, files);
        }
      } catch (imgErr) {
        console.log(
          "IMAGE UPLOAD FAILED:",
          imgErr.response?.data || imgErr.message,
        );
        alert(
          "Listing created ✅ but image upload failed. Add Cloudinary keys.",
        );
      }

      nav("/host/listings");
    } catch (e2) {
      setErr(e2.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

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
                <span>🏡 Create a premium stay</span>
                <span className="text-white/30">•</span>
                <span>Host setup panel</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Create New Listing
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Add your property details, pricing, amenities, safety features,
                and images to publish a professional listing experience.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📍 Location details
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🛏 Amenities & rules
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🖼 Image uploads
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

              <Link
                to="/host/bookings"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                View Bookings
              </Link>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          {/* BASIC INFO */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add title, description, location and core stay details
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Listing Title
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Cozy Sea View Apartment in Goa"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  placeholder="Describe the stay, nearby attractions, ambiance, and what makes it special..."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    value={form.locationText}
                    onChange={(e) => update("locationText", e.target.value)}
                    placeholder="e.g. North Goa, India"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Price (₹ / night)
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    type="number"
                    value={form.priceBase}
                    onChange={(e) => update("priceBase", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Latitude
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(e) => update("lat", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Longitude
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={(e) => update("lng", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Max Guests
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                    type="number"
                    value={form.maxGuests}
                    onChange={(e) => update("maxGuests", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PROPERTY DETAILS */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Property Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add amenities, rules, and eco-friendly highlights
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Amenities
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.amenities}
                  onChange={(e) => update("amenities", e.target.value)}
                  placeholder="wifi, ac, kitchen, balcony, parking"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Separate each amenity with a comma
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  House Rules
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.rules}
                  onChange={(e) => update("rules", e.target.value)}
                  placeholder="no smoking, no pets, no parties"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Separate each rule with a comma
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Eco Tags
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={form.ecoTags}
                  onChange={(e) => update("ecoTags", e.target.value)}
                  placeholder="solar, recycling, EVCharging"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Highlight sustainability features with comma-separated tags
                </p>
              </div>
            </div>
          </div>

          {/* SAFETY + IMAGES */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Safety Features
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Help guests feel more confident while booking
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      CCTV Monitoring
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Property has security camera coverage
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.safety_cctv}
                    onChange={(e) => update("safety_cctv", e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Well-lit Entrance
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Entry path and common approach are well illuminated
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.safety_wellLit}
                    onChange={(e) => update("safety_wellLit", e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Upload Images
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add clear, attractive photos for a stronger listing
                </p>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-slate-100">
                <div className="text-lg font-semibold text-slate-800">
                  Drag photos here or click to upload
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Supports multiple image files
                </div>

                <input
                  className="hidden"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </label>

              {files.length > 0 && (
                <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-800">
                    {files.length} file(s) selected
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedFileNames.map((name, idx) => (
                      <div
                        key={`${name}-${idx}`}
                        className="line-clamp-1 rounded-xl bg-white px-3 py-2 text-sm text-slate-600"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ready to publish your listing?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review your details and create the listing when you’re ready.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/host/listings"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create Listing"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}