const KEY = "staysmart_compare";

export function getCompareItems() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCompareItems(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCompare(listing) {
  const current = getCompareItems();

  const exists = current.some((item) => item._id === listing._id);
  if (exists) return { ok: false, message: "Already added to compare" };

  if (current.length >= 3) {
    return { ok: false, message: "You can compare up to 3 listings only" };
  }

  const next = [...current, listing];
  saveCompareItems(next);

  return { ok: true, items: next };
}

export function removeFromCompare(listingId) {
  const current = getCompareItems();
  const next = current.filter((item) => item._id !== listingId);
  saveCompareItems(next);
  return next;
}

export function clearCompare() {
  saveCompareItems([]);
}