import type { OptionData, Exchange, Asset } from '@/types/option';
import { fetchDeribit } from './deribit';
import { fetchBinance } from './binance';
import { fetchBybit } from './bybit';
import { fetchOKX } from './okx';

export interface AggregatedData {
  options: OptionData[];
  underlyingPrice: number;
  strikes: number[];
  expiries: string[];
  errors: { exchange: Exchange; error: string }[];
  lastUpdate: Date;
}

export async function fetchAllExchanges(asset: Asset): Promise<AggregatedData> {
  const errors: { exchange: Exchange; error: string }[] = [];
  let allOptions: OptionData[] = [];
  let underlyingPrice = 0;
  const allExpiries = new Set<string>();

  // All assets: Deribit, Bybit, Binance
  // BTC/ETH also have OKX
  const fetchers: { exchange: Exchange; fn: Promise<{ options: OptionData[]; expiries: string[]; underlyingPrice: number }> }[] = [
    { exchange: 'Deribit', fn: fetchDeribit(asset) },
    { exchange: 'Bybit', fn: fetchBybit(asset) },
    { exchange: 'Binance', fn: fetchBinance(asset) },
  ];

  if (asset === 'BTC' || asset === 'ETH') {
    fetchers.push({ exchange: 'OKX', fn: fetchOKX(asset) });
  }

  const results = await Promise.allSettled(fetchers.map((f) => f.fn));

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allOptions = allOptions.concat(result.value.options);
      result.value.expiries.forEach((e) => allExpiries.add(e));
      if (result.value.underlyingPrice > 0) {
        underlyingPrice = result.value.underlyingPrice;
      }
    } else {
      console.warn(`Failed to fetch ${fetchers[i].exchange}:`, result.reason);
      errors.push({ exchange: fetchers[i].exchange, error: result.reason?.message || 'Unknown error' });
    }
  });

  const strikes = [...new Set(allOptions.map((o) => o.strike))].sort((a, b) => a - b);
  const expiries = Array.from(allExpiries).sort();

  return { options: allOptions, underlyingPrice, strikes, expiries, errors, lastUpdate: new Date() };
}
