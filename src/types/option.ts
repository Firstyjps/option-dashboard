export type Exchange = 'Deribit' | 'Binance' | 'Bybit' | 'OKX';
export type Asset = 'SOL' | 'BTC' | 'ETH';
export type OptionSide = 'call' | 'put';
export type TabId = 'best' | 'iv' | 'oi' | 'chain' | 'arbitrage' | 'position' | 'greeks';

export interface OptionData {
  strike: number;
  exchange: Exchange;
  side: OptionSide;
  asset: Asset;
  expiry: string;
  bid: number;
  ask: number;
  mark: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  oi: number;
  volume: number;
  size_bid: number;
  size_ask: number;
}

export interface ExchangeConfig {
  name: Exchange;
  color: string;
  bg: string;
}

export interface ArbitrageOpportunity {
  strike: number;
  side: OptionSide;
  buyExchange: Exchange;
  buyAsk: number;
  sellExchange: Exchange;
  sellBid: number;
  spread: number;
  spreadPercent: number;
}

export interface PositionLeg {
  id: string;
  side: OptionSide;
  direction: 'buy' | 'sell';
  strike: number;
  quantity: number;
  premium: number;
}

export interface DashboardStats {
  totalOI: number;
  totalVol: number;
  putCallRatio: number;
  avgATMiv: number;
}
