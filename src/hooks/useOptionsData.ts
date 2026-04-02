import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { OptionData, Exchange, Asset } from '@/types/option';
import { fetchAllExchanges, type AggregatedData } from '@/api/aggregator';
import { ALL_DATA } from '@/data/mockGenerator';
import { STRIKES, UNDERLYING } from '@/constants/strikes';
import { useDashboardStore } from '@/stores/dashboardStore';

interface UseOptionsDataReturn {
  data: OptionData[];
  underlyingPrice: number;
  strikes: number[];
  expiries: string[];
  availableExchanges: Exchange[];
  isLoading: boolean;
  isLive: boolean;
  errors: { exchange: Exchange; error: string }[];
  lastUpdate: Date | null;
  refresh: () => void;
}

const REFRESH_INTERVAL = 30_000;

export function useOptionsData(): UseOptionsDataReturn {
  const [aggData, setAggData] = useState<AggregatedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevAssetRef = useRef<Asset | null>(null);

  const { selectedAsset, selectedExpiry, setSelectedExpiry } = useDashboardStore();

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchAllExchanges(selectedAsset);
      if (result.options.length > 0) {
        setAggData(result);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    } catch (err) {
      console.warn('Failed to fetch live data:', err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsset]);

  // Auto-select expiry only when asset changes
  useEffect(() => {
    if (aggData && aggData.options.length > 0 && prevAssetRef.current !== selectedAsset) {
      const expiryCounts: Record<string, number> = {};
      aggData.options.forEach((o) => {
        expiryCounts[o.expiry] = (expiryCounts[o.expiry] || 0) + 1;
      });
      const sorted = Object.entries(expiryCounts).sort((a, b) => b[1] - a[1]);
      setSelectedExpiry(sorted[0]?.[0] || '');
      prevAssetRef.current = selectedAsset;
    }
  }, [aggData, selectedAsset, setSelectedExpiry]);

  // Re-fetch when asset changes
  useEffect(() => {
    setIsLoading(true);
    setAggData(null);
    fetchData();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!isLive || !aggData) return ALL_DATA;
    if (!selectedExpiry) return aggData.options;
    return aggData.options.filter((o) => o.expiry === selectedExpiry);
  }, [isLive, aggData, selectedExpiry]);

  const filteredStrikes = useMemo(() => {
    if (!isLive) return STRIKES;
    return [...new Set(filteredData.map((o) => o.strike))].sort((a, b) => a - b);
  }, [isLive, filteredData]);

  const allExpiries = useMemo(() => {
    if (!aggData) return [];
    return [...new Set(aggData.options.map((o) => o.expiry))].sort();
  }, [aggData]);

  // Which exchanges have data for current asset
  const availableExchanges = useMemo<Exchange[]>(() => {
    if (!aggData) return ['Deribit', 'Bybit', 'Binance'];
    return [...new Set(aggData.options.map((o) => o.exchange))];
  }, [aggData]);

  return {
    data: filteredData,
    underlyingPrice: isLive && aggData ? aggData.underlyingPrice : UNDERLYING,
    strikes: filteredStrikes,
    expiries: allExpiries,
    availableExchanges,
    isLoading,
    isLive,
    errors: aggData?.errors || [],
    lastUpdate: aggData?.lastUpdate || null,
    refresh,
  };
}
