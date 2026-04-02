import { useDashboardStore } from '@/stores/dashboardStore';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useOptionsData } from '@/hooks/useOptionsData';
import { EX_COLORS } from '@/constants/exchanges';
import type { Asset } from '@/types/option';
import { colors, fonts } from '@/styles/theme';
import { formatExpiry } from '@/utils/expiry';

import { Header } from '@/components/layout/Header';

import { TabBar } from '@/components/layout/TabBar';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Legend } from '@/components/ui/Legend';
import { IVSmileChart } from '@/components/charts/IVSmileChart';
import { OIBarChart } from '@/components/charts/OIBarChart';
import { BestPriceFinder } from '@/components/tables/BestPriceFinder';
import { OptionsChain } from '@/components/tables/OptionsChain';
import { ArbitrageScanner } from '@/components/features/ArbitrageScanner';
import { PositionBuilder } from '@/components/features/PositionBuilder';
import { GreeksCalculator } from '@/components/features/GreeksCalculator';

export default function App() {
  const {
    selectedAsset, selectedExchanges, optionSide, activeTab, selectedStrike, selectedExpiry,
    setSelectedAsset, toggleExchange, setOptionSide, setActiveTab, setSelectedStrike, setSelectedExpiry,
  } = useDashboardStore();

  const {
    data, underlyingPrice, strikes, expiries, availableExchanges, isLoading, isLive,
    errors, lastUpdate, refresh,
  } = useOptionsData();

  const ASSETS: { id: Asset; label: string; color: string }[] = [
    { id: 'SOL', label: 'SOL', color: '#9945FF' },
    { id: 'BTC', label: 'BTC', color: '#F7931A' },
    { id: 'ETH', label: 'ETH', color: '#627EEA' },
  ];

  const stats = useDashboardStats(data, selectedExchanges, underlyingPrice);

  // Use dynamic strikes from live data, or fallback
  const displayStrikes = strikes.length > 0 ? strikes : [60, 65, 70, 75, 80, 85, 90, 95, 100];

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: '#fff', fontFamily: fonts.sans, padding: 0 }}>
      <Header
        asset={selectedAsset}
        underlyingPrice={underlyingPrice}
        isLive={isLive}
        isLoading={isLoading}
        lastUpdate={lastUpdate}
        errors={errors}
        onRefresh={refresh}
      />

      <div style={{ padding: '20px 28px' }}>
        {/* Error banner */}
        {errors.length > 0 && (
          <div style={{
            marginBottom: '16px', padding: '10px 16px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            fontSize: '11px', fontFamily: fonts.mono, color: colors.textTertiary,
          }}>
            {errors.map((e, i) => (
              <span key={i}>
                <span style={{ color: colors.red }}>{e.exchange}</span>: {e.error}
                {i < errors.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Asset + Exchange Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '1.2px', marginRight: '4px', fontFamily: fonts.mono }}>
            Asset
          </span>
          {ASSETS.map((a) => (
            <Badge key={a.id} color={a.color} active={selectedAsset === a.id} onClick={() => setSelectedAsset(a.id)}>
              {a.label}
            </Badge>
          ))}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />

          <span style={{ fontSize: '10px', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '1.2px', marginRight: '4px', fontFamily: fonts.mono }}>
            Exchanges
          </span>
          {availableExchanges.map((ex) => (
            <Badge key={ex} color={EX_COLORS[ex]} active={selectedExchanges.includes(ex)} onClick={() => toggleExchange(ex)}>
              {ex}
            </Badge>
          ))}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />

          <span style={{ fontSize: '10px', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '1.2px', marginRight: '4px', fontFamily: fonts.mono }}>
            Side
          </span>
          <Badge color="#1DB954" active={optionSide === 'call'} onClick={() => setOptionSide('call')}>Calls</Badge>
          <Badge color="#ef4444" active={optionSide === 'put'} onClick={() => setOptionSide('put')}>Puts</Badge>
        </div>

        {/* Expiry Selector */}
        {expiries.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '10px', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '1.2px', marginRight: '4px', fontFamily: fonts.mono }}>
              Expiry
            </span>
            {expiries.map((exp) => (
              <button
                key={exp}
                onClick={() => setSelectedExpiry(exp)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: fonts.mono,
                  cursor: 'pointer', transition: 'all 0.2s', fontWeight: selectedExpiry === exp ? 600 : 400,
                  border: selectedExpiry === exp ? '1.5px solid #1DB954' : '1.5px solid rgba(255,255,255,0.08)',
                  background: selectedExpiry === exp ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.03)',
                  color: selectedExpiry === exp ? '#1DB954' : 'rgba(255,255,255,0.4)',
                }}
              >
                {formatExpiry(exp)}
              </button>
            ))}
            <button
              onClick={() => setSelectedExpiry('')}
              style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: fonts.mono,
                cursor: 'pointer', transition: 'all 0.2s', fontWeight: !selectedExpiry ? 600 : 400,
                border: !selectedExpiry ? '1.5px solid #1DB954' : '1.5px solid rgba(255,255,255,0.08)',
                background: !selectedExpiry ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.03)',
                color: !selectedExpiry ? '#1DB954' : 'rgba(255,255,255,0.4)',
                boxShadow: !selectedExpiry ? '0 0 12px rgba(29,185,84,0.4)' : 'none',
              }}
            >
              ALL
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <StatCard label="Total OI" value={stats.totalOI.toLocaleString()} sub="contracts" />
          <StatCard label="24h Volume" value={stats.totalVol.toLocaleString()} sub="contracts" />
          <StatCard label="Put/Call Ratio" value={stats.putCallRatio.toFixed(2)}
            accent={stats.putCallRatio > 1 ? '#ef4444' : '#1DB954'}
            sub={stats.putCallRatio > 1 ? 'Bearish bias' : 'Bullish bias'} />
          <StatCard label="ATM IV (avg)" value={`${stats.avgATMiv.toFixed(1)}%`} accent="#F7A600" sub="Implied Volatility" />
        </div>

        {/* Tabs */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Loading overlay */}
        {isLoading && data.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: colors.textTertiary,
            fontSize: '13px', fontFamily: fonts.mono,
          }}>
            Loading exchange data...
          </div>
        )}

        {/* Content */}
        {data.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            {activeTab === 'best' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    Best {optionSide === 'call' ? 'Call' : 'Put'} Prices Across Exchanges
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textFaint, fontFamily: fonts.mono }}>
                    Sorted by lowest ask price
                  </div>
                </div>
                <BestPriceFinder data={data} selectedExchanges={selectedExchanges} side={optionSide} underlyingPrice={underlyingPrice} />
              </div>
            )}

            {activeTab === 'iv' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                  IV Smile — {optionSide === 'call' ? 'Calls' : 'Puts'}
                </div>
                <IVSmileChart data={data} selectedExchanges={selectedExchanges} side={optionSide} />
                <Legend exchanges={selectedExchanges} />
              </div>
            )}

            {activeTab === 'oi' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                  Open Interest by Strike — {optionSide === 'call' ? 'Calls' : 'Puts'}
                </div>
                <OIBarChart data={data} selectedExchanges={selectedExchanges} side={optionSide} />
                <Legend exchanges={selectedExchanges} />
              </div>
            )}

            {activeTab === 'chain' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    Strike {selectedStrike} — Exchange Comparison
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {displayStrikes.map((s) => (
                      <button key={s} onClick={() => setSelectedStrike(s)} style={{
                        padding: '4px 10px', borderRadius: '4px',
                        border: selectedStrike === s ? '1px solid #1DB954' : '1px solid rgba(255,255,255,0.06)',
                        background: selectedStrike === s ? 'rgba(29,185,84,0.15)' : 'transparent',
                        color: selectedStrike === s ? '#1DB954' : Math.abs(s - underlyingPrice) < 5 ? '#fff' : 'rgba(255,255,255,0.4)',
                        fontSize: '11px', cursor: 'pointer', fontFamily: fonts.mono,
                        fontWeight: Math.abs(s - underlyingPrice) < 5 ? 700 : 400,
                      }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <OptionsChain data={data} selectedExchanges={selectedExchanges} strike={selectedStrike} />
              </div>
            )}

            {activeTab === 'arbitrage' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                  Cross-Exchange Arbitrage Scanner
                </div>
                <ArbitrageScanner data={data} selectedExchanges={selectedExchanges} />
              </div>
            )}

            {activeTab === 'position' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                  Position Builder &amp; Payoff Diagram
                </div>
                <PositionBuilder data={data} strikes={displayStrikes} underlyingPrice={underlyingPrice} />
              </div>
            )}

            {activeTab === 'greeks' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                  Black-Scholes Greeks Calculator
                </div>
                <GreeksCalculator underlyingPrice={underlyingPrice} />
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
