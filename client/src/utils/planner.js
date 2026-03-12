export function getPlannerRecommendations(listings, planner) {
  const city = (planner.city || "").trim().toLowerCase();
  const vibe = (planner.vibe || "").trim().toLowerCase();
  const budget = Number(planner.budget || 0);
  const guests = Number(planner.guests || 0);

  const scored = listings.map((l) => {
    let score = 0;
    const reasons = [];

    const title = (l.title || "").toLowerCase();
    const location = (l.locationText || "").toLowerCase();
    const desc = (l.description || "").toLowerCase();
    const amenities = Array.isArray(l.amenities) ? l.amenities : [];
    const ecoTags = Array.isArray(l.ecoTags) ? l.ecoTags : [];

    if (city && location.includes(city)) {
      score += 4;
      reasons.push("City match");
    }

    if (guests && Number(l.maxGuests || 0) >= guests) {
      score += 3;
      reasons.push("Fits guests");
    }

    if (budget && Number(l.priceBase || 0) <= budget) {
      score += 4;
      reasons.push("Within budget");
    } else if (budget && Number(l.priceBase || 0) <= budget * 1.2) {
      score += 1;
      reasons.push("Close to budget");
    }

    if (vibe) {
      const textBlob = `${title} ${location} ${desc} ${amenities.join(" ")} ${ecoTags.join(" ")}`;

      if (textBlob.includes(vibe)) {
        score += 4;
        reasons.push("Vibe match");
      }

      if (
        vibe === "workation" &&
        (amenities.includes("wifi") || amenities.includes("workspace"))
      ) {
        score += 3;
        reasons.push("Work-friendly");
      }

      if (
        vibe === "eco" &&
        ecoTags.length > 0
      ) {
        score += 3;
        reasons.push("Eco features");
      }

      if (
        vibe === "family" &&
        Number(l.maxGuests || 0) >= 4
      ) {
        score += 3;
        reasons.push("Family sized");
      }

      if (
        vibe === "couple" &&
        Number(l.maxGuests || 0) <= 2
      ) {
        score += 3;
        reasons.push("Couple friendly");
      }

      if (
        vibe === "luxury" &&
        Number(l.priceBase || 0) >= 6000
      ) {
        score += 3;
        reasons.push("Premium stay");
      }

      if (
        vibe === "budget" &&
        Number(l.priceBase || 0) <= 2500
      ) {
        score += 3;
        reasons.push("Budget friendly");
      }
    }

    return {
      ...l,
      plannerScore: score,
      plannerReasons: reasons.slice(0, 3),
    };
  });

  return scored
    .filter((l) => l.plannerScore > 0)
    .sort((a, b) => b.plannerScore - a.plannerScore)
    .slice(0, 6);
}