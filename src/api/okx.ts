import type { OptionData, Asset } from '@/types/option';
import { normalizeExpiry } from '@/utils/expiry';

interface OKXTicker {
  instId: string;
  bidPx: string;
  bidSz: string;
  askPx: string;
  askSz: string;
  last: string;
  vol24h: string;
  oi: string;
}

interface OKXOptSummary {
  instId: string;
  delta: string;
  deltaBS: string;
  gamma: string;
  gammaBS: string;
  theta: string;
  thetaBS: string;
  vega: string;
  vegaBS: string;
  markVol: string;
}

const OKX_FAMILY: Record<string, string> = { BTC: 'BTC-USD', ETH: 'ETH-USD' };

function parseInstId(instId: string): { strike: number; side: 'call' | 'put'; expiry: string } | null {
  // BTC-USD-250627-80000-C
  const parts = instId.split('-');
  if (parts.length < 5) return null;
  return { strike: parseFloat(parts[3]), side: parts[4] === 'C' ? 'call' : 'put', expiry: parts[2] };
}

export async function fetchOKX(asset: Asset): Promise<{ options: OptionData[]; expiries: string[]; underlyingPrice: number }> {
  const family = OKX_FAMILY[asset];
  if (!family) return { options: [], expiries: [], underlyingPrice: 0 };

  // Fetch tickers (prices) and opt-summary (greeks) in parallel
  const [tickerResp, summaryResp] = await Promise.all([
    fetch(`/api/okx/api/v5/market/tickers?instType=OPTION&instFamily=${family}`),
    fetch(`/api/okx/api/v5/public/opt-summary?instFamily=${family}`),
  ]);

  const tickerJson = await tickerResp.json();
  const summaryJson = await summaryResp.json();

  const tickers: OKXTicker[] = tickerJson.data || [];
  const summaries: OKXOptSummary[] = summaryJson.data || [];

  // Build greeks lookup
  const greeksMap = new Map<string, OKXOptSummary>();
  summaries.forEach((s) => greeksMap.set(s.instId, s));

  // Get underlying price from index
  let underlyingPrice = 0;
  try {
    const indexResp = await fetch(`/api/okx/api/v5/market/index-tickers?instId=${asset}-USD`);
    const indexJson = await indexResp.json();
    const idxPrice = parseFloat(indexJson.data?.[0]?.idxPx || '0');
    if (idxPrice > 0) underlyingPrice = idxPrice;
  } catch {}

  const expiries = new Set<string>();
  const options: OptionData[] = [];

  for (const t of tickers) {
    const parsed = parseInstId(t.instId);
    if (!parsed) continue;

    const normExpiry = normalizeExpiry(parsed.expiry);
    expiries.add(normExpiry);

    // OKX BTC/ETH prices are in fraction of underlying (e.g., 0.14 BTC)
    const bidRaw = parseFloat(t.bidPx) || 0;
    const askRaw = parseFloat(t.askPx) || 0;
    const lastRaw = parseFloat(t.last) || 0;
    const markRaw = (bidRaw + askRaw) / 2 || lastRaw;

    if (markRaw <= 0) continue;

    // Convert to USD
    const multiplier = underlyingPrice > 0 ? underlyingPrice : 1;
    const bid = bidRaw * multiplier;
    const ask = askRaw * multiplier;
    const mark = markRaw * multiplier;

    const greeks = greeksMap.get(t.instId);

    options.push({
      strike: parsed.strike, exchange: 'OKX', side: parsed.side, asset, expiry: normExpiry,
      bid: +bid.toFixed(2), ask: +ask.toFixed(2), mark: +mark.toFixed(2),
      iv: +(parseFloat(greeks?.markVol || '0') * 100).toFixed(1),
      delta: parseFloat(greeks?.deltaBS || greeks?.delta || '0'),
      gamma: parseFloat(greeks?.gammaBS || greeks?.gamma || '0'),
      theta: parseFloat(greeks?.thetaBS || greeks?.theta || '0'),
      vega: parseFloat(greeks?.vegaBS || greeks?.vega || '0'),
      oi: Math.round(parseFloat(t.oi) || 0),
      volume: Math.round(parseFloat(t.vol24h) || 0),
      size_bid: Math.round(parseFloat(t.bidSz) || 0),
      size_ask: Math.round(parseFloat(t.askSz) || 0),
    });
  }

  return { options, expiries: Array.from(expiries).sort(), underlyingPrice };
}
