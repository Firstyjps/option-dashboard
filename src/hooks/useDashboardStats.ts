import { useMemo } from 'react';
import type { Exchange, OptionData, DashboardStats } from '@/types/option';

export function useDashboardStats(
  data: OptionData[],
  selectedExchanges: Exchange[],
  underlyingPrice: number = 0
): DashboardStats {
  return useMemo(() => {
    const filtered = data.filter((d) => selectedExchanges.includes(d.exchange));
    const totalOI = filtered.reduce((s, d) => s + d.oi, 0);
    const totalVol = filtered.reduce((s, d) => s + d.volume, 0);
    const callOI = filtered
      .filter((d) => d.side === 'call')
      .reduce((s, d) => s + d.oi, 0);
    const putOI = filtered
      .filter((d) => d.side === 'put')
      .reduce((s, d) => s + d.oi, 0);

    // Find ATM based on underlying price or use median strike
    const allStrikes = [...new Set(filtered.map((d) => d.strike))].sort((a, b) => a - b);
    const atmRef = underlyingPrice > 0 ? underlyingPrice : (allStrikes[Math.floor(allStrikes.length / 2)] || 0);
    const atmThreshold = underlyingPrice > 0 ? underlyingPrice * 0.05 : 5;

    const atmCalls = filtered.filter(
      (d) => d.side === 'call' && Math.abs(d.strike - atmRef) < atmThreshold
    );
    const avgATMiv = atmCalls.length
      ? atmCalls.reduce((s, d) => s + d.iv, 0) / atmCalls.length
      : 0;

    return {
      totalOI,
      totalVol,
      putCallRatio: putOI / (callOI || 1),
      avgATMiv,
    };
  }, [data, selectedExchanges, underlyingPrice]);
}
