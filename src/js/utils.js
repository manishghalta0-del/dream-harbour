export const q = (sel) => document.querySelector(sel);
export const qAll = (sel) => Array.from(document.querySelectorAll(sel));

export function formatCurrency(n) {
  const num = Number(n || 0);
  return num.toFixed(2);
}

export function safeParseFloat(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
