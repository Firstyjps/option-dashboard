import type { Exchange, OptionData, OptionSide } from '@/types/option';
import { ALL_EXCHANGES as EXCHANGES } from '@/constants/exchanges';
import { STRIKES, UNDERLYING, DTE } from '@/constants/strikes';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function genOption(strike: number, ex: Exchange, side: OptionSide): OptionData {
  const moneyness = side === 'call'
    ? (strike - UNDERLYING) / UNDERLYING
    : (UNDERLYING - strike) / UNDERLYING;
  const itm = side === 'call' ? strike < UNDERLYING : strike > UNDERLYING;
  const atm = Math.abs(strike - UNDERLYING) < 5;

  const baseIV = 0.65 + Math.abs(moneyness) * 0.15 + (rand() - 0.5) * 0.03;
  const exSpread: Record<Exchange, number> = { Deribit: 0, Binance: 0.005, Bybit: 0.012, OKX: 0.008 };

  const intrinsic = side === 'call'
    ? Math.max(0, UNDERLYING - strike)
    : Math.max(0, strike - UNDERLYING);
  const timeValue = UNDERLYING * baseIV * Math.sqrt(DTE / 365) * (0.4 + rand() * 0.2);
  const mark = intrinsic + timeValue * (atm ? 1 : itm ? 0.85 : 0.7);

  const liqMultiplier: Record<Exchange, number> = { Deribit: 1, Binance: 0.7, OKX: 0.5, Bybit: 0.3 };
  const baseLiq = atm ? 800 : itm ? 400 : Math.max(50, 600 - Math.abs(moneyness) * 2000);

  const spread = mark * (0.01 + exSpread[ex] + (atm ? 0 : 0.02));
  const bid = Math.max(0.01, +(mark - spread).toFixed(2));
  const ask = +(mark + spread).toFixed(2);

  const sqrtT = Math.sqrt(DTE / 365);
  const delta = side === 'call'
    ? Math.max(0.01, Math.min(0.99, 0.5 + (UNDERLYING - strike) / (UNDERLYING * baseIV * sqrtT * 2)))
    : -Math.max(0.01, Math.min(0.99, 0.5 + (strike - UNDERLYING) / (UNDERLYING * baseIV * sqrtT * 2)));

  return {
    strike,
    exchange: ex,
    side,
    asset: 'SOL',
    expiry: '20260626',
    bid,
    ask,
    mark: +mark.toFixed(2),
    iv: +(baseIV * 100 + exSpread[ex] * 100).toFixed(1),
    delta: +delta.toFixed(3),
    gamma: +(0.01 * (atm ? 2 : 0.5) + rand() * 0.005).toFixed(4),
    theta: +(-mark * 0.015 - rand() * 0.02).toFixed(3),
    vega: +(mark * 0.08 + rand() * 0.01).toFixed(3),
    oi: Math.round(baseLiq * liqMultiplier[ex] * (0.7 + rand() * 0.6)),
    volume: Math.round(baseLiq * liqMultiplier[ex] * 0.3 * rand()),
    size_bid: Math.round(10 + rand() * (atm ? 40 : 15) * liqMultiplier[ex]),
    size_ask: Math.round(5 + rand() * (atm ? 30 : 10) * liqMultiplier[ex]),
  };
}

export function generateAllData(): OptionData[] {
  const data: OptionData[] = [];
  EXCHANGES.forEach((ex) => {
    STRIKES.forEach((s) => {
      data.push(genOption(s, ex, 'call'));
      data.push(genOption(s, ex, 'put'));
    });
  });
  return data;
}

export const ALL_DATA = generateAllData();
