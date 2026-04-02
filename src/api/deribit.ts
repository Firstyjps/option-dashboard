import type { OptionData, Asset } from '@/types/option';
import { normalizeExpiry } from '@/utils/expiry';

interface DeribitBookSummary {
  instrument_name: string;
  bid_price: number | null;
  ask_price: number | null;
  mark_price: number;
  mark_iv: number;
  underlying_price: number;
  open_interest: number;
  volume: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

// Deribit currency mapping: SOL → USDC, BTC → BTC, ETH → ETH
const DERIBIT_CURRENCY: Record<Asset, string> = { SOL: 'USDC', BTC: 'BTC', ETH: 'ETH' };
const DERIBIT_PREFIX: Record<Asset, string> = { SOL: 'SOL_USDC', BTC: 'BTC', ETH: 'ETH' };

function parseInstrument(name: string): { strike: number; side: 'call' | 'put'; expiry: string } | null {
  const parts = name.split('-');
  if (parts.length < 4) return null;
  const strike = parseFloat(parts[2]);
  if (isNaN(strike)) return null;
  return { strike, side: parts[3] === 'C' ? 'call' : 'put', expiry: parts[1] };
}

export async function fetchDeribit(asset: Asset): Promise<{ options: OptionData[]; underlyingPrice: number; expiries: string[] }> {
  const currency = DERIBIT_CURRENCY[asset];
  const prefix = DERIBIT_PREFIX[asset];

  const resp = await fetch(`/api/deribit/api/v2/public/get_book_summary_by_currency?currency=${currency}&kind=option`);
  const json = await resp.json();
  const results: DeribitBookSummary[] = json.result || [];
  const filtered = results.filter((r) => r.instrument_name.startsWith(prefix));

  let underlyingPrice = 0;
  const expiries = new Set<string>();
  const options: OptionData[] = [];

  for (const r of filtered) {
    const parsed = parseInstrument(r.instrument_name);
    if (!parsed) continue;

    const normExpiry = normalizeExpiry(parsed.expiry);
    expiries.add(normExpiry);
    if (r.underlying_price > 0) underlyingPrice = r.underlying_price;

    // BTC/ETH: mark_price is fraction of underlying. SOL_USDC: already in USD.
    const mark = asset === 'SOL' ? r.mark_price : r.mark_price * r.underlying_price;
    const bid = r.bid_price != null ? (asset === 'SOL' ? r.bid_price : r.bid_price * r.underlying_price) : 0;
    const ask = r.ask_price != null ? (asset === 'SOL' ? r.ask_price : r.ask_price * r.underlying_price) : (mark > 0 ? mark * 1.02 : 0);

    if (mark <= 0) continue;

    options.push({
      strike: parsed.strike, exchange: 'Deribit', side: parsed.side, asset, expiry: normExpiry,
      bid: +bid.toFixed(4), ask: +ask.toFixed(4), mark: +mark.toFixed(4),
      iv: +(r.mark_iv || 0).toFixed(1),
      delta: +(r.delta || 0).toFixed(4), gamma: +(r.gamma || 0).toFixed(6),
      theta: +(r.theta || 0).toFixed(4), vega: +(r.vega || 0).toFixed(4),
      oi: Math.round(r.open_interest || 0), volume: Math.round(r.volume || 0),
      size_bid: 0, size_ask: 0,
    });
  }

  return { options, underlyingPrice, expiries: Array.from(expiries).sort() };
}
