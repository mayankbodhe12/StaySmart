export function eachNightDates(checkIn, checkOut) {
  const dates = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return dates;
  }

  const cur = new Date(start);
  while (cur < end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return dates;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday/Saturday
}

function isWithinRange(date, startDate, endDate) {
  if (!startDate || !endDate) return false;

  const d = new Date(date);
  const s = new Date(startDate);
  const e = new Date(endDate);

  if (
    Number.isNaN(d.getTime()) ||
    Number.isNaN(s.getTime()) ||
    Number.isNaN(e.getTime())
  ) {
    return false;
  }

  d.setHours(0, 0, 0, 0);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  return d >= s && d <= e;
}

export function calculateBookingPrice(listing, checkIn, checkOut) {
  const nights = eachNightDates(checkIn, checkOut);
  const rules = Array.isArray(listing?.pricingRules) ? listing.pricingRules : [];

  let subtotal = 0;
  const breakdown = [];

  for (const nightDate of nights) {
    let nightPrice = Number(listing?.priceBase || 0);
    let appliedRule = "base";

    for (const rule of rules) {
      if (
        rule.type === "weekend" &&
        isWeekend(nightDate) &&
        rule.price != null
      ) {
        nightPrice = Number(rule.price);
        appliedRule = rule.name || "weekend";
      }

      if (
        rule.type === "date_range" &&
        isWithinRange(nightDate, rule.startDate, rule.endDate) &&
        rule.price != null
      ) {
        nightPrice = Number(rule.price);
        appliedRule = rule.name || "date_range";
      }

      if (
        rule.type === "discount" &&
        isWithinRange(nightDate, rule.startDate, rule.endDate) &&
        rule.percentage != null
      ) {
        nightPrice = Math.round(
          nightPrice * (1 - Number(rule.percentage) / 100)
        );
        appliedRule = rule.name || "discount";
      }
    }

    subtotal += nightPrice;
    breakdown.push({
      date: nightDate,
      price: nightPrice,
      rule: appliedRule,
    });
  }

  return {
    nights: nights.length,
    pricePerNightBase: Number(listing?.priceBase || 0),
    totalAmount: subtotal,
    breakdown,
  };
}