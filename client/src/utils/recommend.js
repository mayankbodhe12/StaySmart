export function getStayBadges(listing) {
  const badges = [];

  const price = Number(listing.priceBase || 0);
  const guests = Number(listing.maxGuests || 0);
  const amenities = listing.amenities || [];
  const eco = listing.ecoTags || [];

  if (price <= 2000) badges.push({ label: "Budget stay", icon: "💰" });

  if (price >= 6000) badges.push({ label: "Luxury stay", icon: "🏨" });

  if (guests >= 4) badges.push({ label: "Family friendly", icon: "👨‍👩‍👧" });

  if (guests <= 2) badges.push({ label: "Best for couples", icon: "💑" });

  if (amenities.includes("wifi") || amenities.includes("workspace")) {
    badges.push({ label: "Workation ready", icon: "💻" });
  }

  if (eco.length > 0) {
    badges.push({ label: "Eco friendly", icon: "🌱" });
  }

  return badges.slice(0, 3); // max 3 badges
}