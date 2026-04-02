import type { Exchange, ExchangeConfig } from '@/types/option';

export const ALL_EXCHANGES: Exchange[] = ['Deribit', 'Bybit', 'Binance', 'OKX'];

export const EXCHANGE_CONFIGS: Record<Exchange, ExchangeConfig> = {
  Deribit: { name: 'Deribit', color: '#1DB954', bg: 'rgba(29,185,84,0.08)' },
  Binance: { name: 'Binance', color: '#F0B90B', bg: 'rgba(240,185,11,0.08)' },
  Bybit: { name: 'Bybit', color: '#F7A600', bg: 'rgba(247,166,0,0.08)' },
  OKX: { name: 'OKX', color: '#FFFFFF', bg: 'rgba(255,255,255,0.06)' },
};

export const EX_COLORS: Record<Exchange, string> = {
  Deribit: '#1DB954',
  Binance: '#F0B90B',
  Bybit: '#F7A600',
  OKX: '#FFFFFF',
};
