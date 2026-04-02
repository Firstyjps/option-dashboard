import type { OptionData, Asset } from '@/types/option';
import { normalizeExpiry } from '@/utils/expiry';

interface BinanceMark {
  symbol: string;
  markPrice: string;
  markIV: string;
  delta: string;
  theta: string;
  gamma: string;
  vega: string;
}

interface BinanceTicker {
  symbol: string;
  bidPrice: string;
  askPrice: string;
  volume: string;
  exercisePrice: string;
}

function parseSymbol(symbol: string): { strike: number; side: 'call' | 'put'; expiry: string } | null {
  const parts = symbol.split('-');
  if (parts.length < 4) return null;
  return { strike: parseFloat(parts[2]), side: parts[3] === 'C' ? 'call' : 'put', expiry: parts[1] };
}

async function safeFetch(url: string): Promise<Response> {
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text();
    if (body.includes('-1003') || body.includes('banned')) {
      throw new Error('Binance rate limited');
    }
    throw new Error(`Binance HTTP ${resp.status}`);
  }
  return resp;
}

// Binance returns ALL assets in one call — we cache & filter
let markCache: { data: BinanceMark[]; ts: number } | null = null;
let tickerCache: { data: BinanceTicker[]; ts: number } | null = null;
const CACHE_TTL = 25_000; // 25s cache

async function getMarks(): Promise<BinanceMark[]> {
  if (markCache && Date.now() - markCache.ts < CACHE_TTL) return markCache.data;
  const resp = await safeFetch('/api/binance/eapi/v1/mark');
  const data = await resp.json();
  if (!Array.isArray(data)) {
    if (data?.code) throw new Error(data.msg || 'Binance API error');
    return [];
  }
  markCache = { data, ts: Date.now() };
  return data;
}

async function getTickers(): Promise<BinanceTicker[]> {
  if (tickerCache && Date.now() - tickerCache.ts < CACHE_TTL) return tickerCache.data;
  try {
    const resp = await safeFetch('/api/binance/eapi/v1/ticker');
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    tickerCache = { data, ts: Date.now() };
    return data;
  } catch {
    return [];
  }
}

export async function fetchBinance(asset: Asset): Promise<{ options: OptionData[]; expiries: string[]; underlyingPrice: number }> {
  const [marks, tickers] = await Promise.all([getMarks(), getTickers()]);

  const prefix = `${asset}-`;
  const solMarks = marks.filter((m) => m.symbol.startsWith(prefix));
  const tickerMap = new Map<string, BinanceTicker>();
  tickers.filter((t) => t.symbol.startsWith(prefix)).forEach((t) => tickerMap.set(t.symbol, t));

  const expiries = new Set<string>();
  const options: OptionData[] = [];
  let underlyingPrice = 0;

  for (const m of solMarks) {
    const parsed = parseSymbol(m.symbol);
    if (!parsed) continue;

    const normExpiry = normalizeExpiry(parsed.expiry);
    expiries.add(normExpiry);
    const mark = parseFloat(m.markPrice) || 0;
    if (mark <= 0) continue;

    const ticker = tickerMap.get(m.symbol);
    const exPrice = parseFloat(ticker?.exercisePrice || '0');
    if (exPrice > 0) underlyingPrice = exPrice;

    options.push({
      strike: parsed.strike, exchange: 'Binance', side: parsed.side, asset, expiry: normExpiry,
      bid: parseFloat(ticker?.bidPrice || '0') || 0,
      ask: parseFloat(ticker?.askPrice || '0') || 0, mark,
      iv: +(parseFloat(m.markIV || '0') * 100).toFixed(1),
      delta: parseFloat(m.delta || '0'), gamma: parseFloat(m.gamma || '0'),
      theta: parseFloat(m.theta || '0'), vega: parseFloat(m.vega || '0'),
      oi: 0, volume: Math.round(parseFloat(ticker?.volume || '0') || 0),
      size_bid: 0, size_ask: 0,
    });
  }

  return { options, expiries: Array.from(expiries).sort(), underlyingPrice };
}
