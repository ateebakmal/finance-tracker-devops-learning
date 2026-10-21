// PKR formatting — South-Asian grouping (last 3 digits, then pairs).
// See finance-app-design-doc.md §3.  Rs 1,42,300  not  Rs 142,300.

const NBSP = "\u00a0"; // non-breaking space, keeps "Rs" glued to the number
const MINUS = "\u2212"; // real minus sign, NOT a hyphen "-"

// 142300 -> "1,42,300"
function group(n) {
  const x = String(Math.round(Math.abs(n)));
  if (x.length <= 3) return x;
  const last3 = x.slice(-3);
  const rest = x.slice(0, -3).replace(/\B(?=(\d\d)+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

// "Rs 142,300" — neutral figure (balance, totals)
export function money(n) {
  return `Rs${NBSP}${group(n)}`;
}

// "+Rs 4,500" (income) / "−Rs 8,450" (expense)
export function signed(n, isIncome) {
  const sign = isIncome ? "+" : MINUS;
  return `${sign}Rs${NBSP}${group(n)}`;
}

// Privacy mode
export function masked() {
  return `Rs${NBSP}••••••`;
}
