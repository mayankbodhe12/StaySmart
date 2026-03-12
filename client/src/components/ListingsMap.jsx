import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { Link } from "react-router-dom";

function createPriceIcon(price) {
  return L.divIcon({
    className: "custom-price-marker",
    html: `<div class="price-pin">₹${price}</div>`,
    iconSize: [86, 38],
    iconAnchor: [43, 19],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ listings, fallbackCenter }) {
  const map = useMap();

  useEffect(() => {
    if (!listings.length) {
      map.setView(fallbackCenter, 12);
      return;
    }

    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [listings, map, fallbackCenter]);

  return null;
}

export default function ListingsMap({ listings }) {
  const defaultCenter = [23.2599, 77.4126];

  const validListings = listings.filter(
    (l) =>
      typeof l.lat === "number" &&
      typeof l.lng === "number" &&
      !Number.isNaN(l.lat) &&
      !Number.isNaN(l.lng),
  );

  const mapCenter =
    validListings.length > 0
      ? [validListings[0].lat, validListings[0].lng]
      : defaultCenter;

  if (validListings.length === 0) {
    return (
      <div className="flex h-[650px] w-full items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
        <div className="px-6">
          <div className="text-xl font-semibold text-slate-900">
            No map locations available
          </div>
          <p className="mt-2 text-sm text-slate-500">
            These listings do not have valid coordinates to display on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <style>
        {`
          .custom-price-marker {
            background: transparent;
            border: none;
          }

          .price-pin {
            background: white;
            color: #0f172a;
            font-weight: 700;
            font-size: 14px;
            padding: 8px 14px;
            border-radius: 9999px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px rgba(15,23,42,0.15);
            white-space: nowrap;
            text-align: center;
            transition: transform 0.2s ease;
          }

          .price-pin:hover {
            transform: translateY(-2px);
          }

          .leaflet-popup-content-wrapper {
            border-radius: 18px;
            box-shadow: 0 18px 40px rgba(15,23,42,0.18);
            border: 1px solid #e2e8f0;
          }

          .leaflet-popup-content {
            margin: 0;
            width: 240px !important;
          }

          .leaflet-popup-tip {
            background: white;
          }

          .leaflet-container {
            font-family: inherit;
          }
        `}
      </style>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
        {validListings.length} stay{validListings.length !== 1 ? "s" : ""} on map
      </div>

      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <FitBounds listings={validListings} fallbackCenter={defaultCenter} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validListings.map((l) => (
          <Marker
            key={l._id}
            position={[l.lat, l.lng]}
            icon={createPriceIcon(l.priceBase)}
          >
            <Popup>
              <div className="overflow-hidden rounded-[18px] bg-white">
                <div className="aspect-[4/3] bg-slate-100">
                  {l.images?.[0] ? (
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="line-clamp-1 text-base font-semibold text-slate-900">
                    {l.title}
                  </div>

                  <div className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {l.locationText}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
                      ₹{l.priceBase} / night
                    </div>
                    <div className="text-xs text-slate-500">
                      Max {l.maxGuests}
                    </div>
                  </div>

                  <Link
                    to={`/listing/${l._id}`}
                    className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    View listing
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}