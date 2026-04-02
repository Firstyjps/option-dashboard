const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Normalize any expiry string to YYYYMMDD for consistent sorting/grouping.
 *
 * Supported inputs:
 *   "3APR26"   → "20260403"  (Deribit/Bybit: dayMONyy)
 *   "26JUN26"  → "20260626"
 *   "260403"   → "20260403"  (Binance: YYMMDD)
 *   "250627"   → "20250627"
 */
export function normalizeExpiry(raw: string): string {
  // Binance format: 6 digits YYMMDD
  if (/^\d{6}$/.test(raw)) {
    const yy = raw.slice(0, 2);
    const mm = raw.slice(2, 4);
    const dd = raw.slice(4, 6);
    return `20${yy}${mm}${dd}`;
  }

  // Deribit/Bybit format: 1-2 digit day + 3-letter month + 2-digit year
  const match = raw.match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
  if (match) {
    const dd = match[1].padStart(2, '0');
    const mm = MONTHS[match[2]] || '01';
    const yy = match[3];
    return `20${yy}${mm}${dd}`;
  }

  return raw; // fallback
}

/**
 * Format normalized YYYYMMDD to human readable "3 Apr 26"
 */
export function formatExpiry(raw: string): string {
  const norm = normalizeExpiry(raw);
  if (norm.length !== 8) return raw;

  const day = parseInt(norm.slice(6, 8), 10);
  const monthIdx = parseInt(norm.slice(4, 6), 10) - 1;
  const year = norm.slice(2, 4);
  const monthName = MONTH_NAMES[monthIdx] || '???';

  return `${day} ${monthName} ${year}`;
}
