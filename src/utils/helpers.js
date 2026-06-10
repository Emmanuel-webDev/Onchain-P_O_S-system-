export function getItemIcon(name) {
  const n = name.toLowerCase();
  if (
    n.includes("coffee") ||
    n.includes("latte") ||
    n.includes("espresso") ||
    n.includes("cappuccino")
  )
    return "☕";
  if (n.includes("tea")) return "🍵";
  if (n.includes("juice") || n.includes("smoothie")) return "🧃";
  if (n.includes("water") || n.includes("drink")) return "💧";
  if (n.includes("cake") || n.includes("pastry") || n.includes("croissant"))
    return "🥐";
  if (n.includes("sandwich") || n.includes("burger")) return "🥪";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("salad")) return "🥗";
  if (n.includes("beer") || n.includes("wine")) return "🍷";
  return "🛍️";
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function shortAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
