import { create } from 'zustand';
import type { Exchange, Asset, SideFilter, TabId, PositionLeg } from '@/types/option';

interface DashboardState {
  selectedAsset: Asset;
  selectedExchanges: Exchange[];
  optionSide: SideFilter;
  activeTab: TabId;
  selectedStrike: number;
  selectedExpiry: string;
  positionLegs: PositionLeg[];

  setSelectedAsset: (asset: Asset) => void;
  toggleExchange: (ex: Exchange) => void;
  setOptionSide: (side: SideFilter) => void;
  setActiveTab: (tab: TabId) => void;
  setSelectedStrike: (strike: number) => void;
  setSelectedExpiry: (expiry: string) => void;
  addPositionLeg: (leg: PositionLeg) => void;
  removePositionLeg: (id: string) => void;
  clearPositionLegs: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedAsset: 'SOL',
  selectedExchanges: ['Deribit', 'Bybit', 'Binance', 'OKX'],
  optionSide: 'call',
  activeTab: 'best',
  selectedStrike: 80,
  selectedExpiry: '',
  positionLegs: [],

  setSelectedAsset: (asset) => set({ selectedAsset: asset, selectedExpiry: '', selectedStrike: asset === 'BTC' ? 80000 : asset === 'ETH' ? 2000 : 80 }),
  toggleExchange: (ex) =>
    set((state) => ({
      selectedExchanges: state.selectedExchanges.includes(ex)
        ? state.selectedExchanges.length > 1
          ? state.selectedExchanges.filter((e) => e !== ex)
          : state.selectedExchanges
        : [...state.selectedExchanges, ex],
    })),

  setOptionSide: (side) => set({ optionSide: side }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedStrike: (strike) => set({ selectedStrike: strike }),
  setSelectedExpiry: (expiry) => set({ selectedExpiry: expiry }),

  addPositionLeg: (leg) =>
    set((state) => ({ positionLegs: [...state.positionLegs, leg] })),

  removePositionLeg: (id) =>
    set((state) => ({
      positionLegs: state.positionLegs.filter((l) => l.id !== id),
    })),

  clearPositionLegs: () => set({ positionLegs: [] }),
}));
