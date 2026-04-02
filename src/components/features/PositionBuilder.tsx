import { useState } from 'react';
import type { OptionData, OptionSide, PositionLeg } from '@/types/option';
import { useDashboardStore } from '@/stores/dashboardStore';
import { PayoffChart } from '@/components/charts/PayoffChart';
import { colors, fonts, baseTable, baseTh, baseTd, baseTr } from '@/styles/theme';

interface PositionBuilderProps {
  data: OptionData[];
  strikes: number[];
  underlyingPrice: number;
}

const PRESETS = [
  { name: 'Long Call', legs: [{ side: 'call' as OptionSide, direction: 'buy' as const, strikeOffset: 0 }] },
  { name: 'Long Put', legs: [{ side: 'put' as OptionSide, direction: 'buy' as const, strikeOffset: 0 }] },
  { name: 'Bull Call Spread', legs: [
    { side: 'call' as OptionSide, direction: 'buy' as const, strikeOffset: -1 },
    { side: 'call' as OptionSide, direction: 'sell' as const, strikeOffset: 1 },
  ]},
  { name: 'Bear Put Spread', legs: [
    { side: 'put' as OptionSide, direction: 'buy' as const, strikeOffset: 1 },
    { side: 'put' as OptionSide, direction: 'sell' as const, strikeOffset: -1 },
  ]},
  { name: 'Long Straddle', legs: [
    { side: 'call' as OptionSide, direction: 'buy' as const, strikeOffset: 0 },
    { side: 'put' as OptionSide, direction: 'buy' as const, strikeOffset: 0 },
  ]},
  { name: 'Iron Condor', legs: [
    { side: 'put' as OptionSide, direction: 'buy' as const, strikeOffset: -3 },
    { side: 'put' as OptionSide, direction: 'sell' as const, strikeOffset: -1 },
    { side: 'call' as OptionSide, direction: 'sell' as const, strikeOffset: 1 },
    { side: 'call' as OptionSide, direction: 'buy' as const, strikeOffset: 3 },
  ]},
];

function getATMIndex(strikes: number[], underlying: number): number {
  let closest = 0, minDiff = Infinity;
  strikes.forEach((s, i) => { const diff = Math.abs(s - underlying); if (diff < minDiff) { minDiff = diff; closest = i; } });
  return closest;
}

const selectStyle: React.CSSProperties = {
  background: '#0a0a0b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '12px',
  fontFamily: fonts.mono,
  color: '#fff',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  marginBottom: '4px',
  fontFamily: fonts.mono,
};

export function PositionBuilder({ data, strikes, underlyingPrice }: PositionBuilderProps) {
  const { positionLegs, addPositionLeg, removePositionLeg, clearPositionLegs } = useDashboardStore();
  const [newSide, setNewSide] = useState<OptionSide>('call');
  const [newDir, setNewDir] = useState<'buy' | 'sell'>('buy');
  const defaultStrike = strikes.length > 0 ? strikes[Math.floor(strikes.length / 2)] : 80;
  const [newStrike, setNewStrike] = useState(defaultStrike);
  const [newQty, setNewQty] = useState(1);

  const addLeg = () => {
    const opt = data.find((d) => d.strike === newStrike && d.side === newSide && d.exchange === 'Deribit');
    const premium = opt ? (newDir === 'buy' ? opt.ask : opt.bid) : 0;
    addPositionLeg({ id: crypto.randomUUID(), side: newSide, direction: newDir, strike: newStrike, quantity: newQty, premium });
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    clearPositionLegs();
    const atmIdx = getATMIndex(strikes, underlyingPrice);
    preset.legs.forEach((leg) => {
      const idx = Math.max(0, Math.min(strikes.length - 1, atmIdx + leg.strikeOffset));
      const strike = strikes[idx];
      const opt = data.find((d) => d.strike === strike && d.side === leg.side);
      const premium = opt ? (leg.direction === 'buy' ? opt.ask : opt.bid) : 0;
      addPositionLeg({ id: crypto.randomUUID(), side: leg.side, direction: leg.direction, strike, quantity: 1, premium });
    });
  };

  const totalCost = positionLegs.reduce((sum, leg) => sum + leg.premium * leg.quantity * (leg.direction === 'buy' ? -1 : 1), 0);

  const btnBase: React.CSSProperties = {
    padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontFamily: fonts.mono,
    cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
  };

  return (
    <div>
      {/* Presets */}
      <div style={{ marginBottom: '16px' }}>
        <div style={labelStyle}>Strategy Presets</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => applyPreset(p)} style={{
              ...btnBase,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: colors.textSecondary,
            }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Leg */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap',
        marginBottom: '16px', padding: '14px 16px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <label style={labelStyle}>Side</label>
          <select value={newSide} onChange={(e) => setNewSide(e.target.value as OptionSide)} style={selectStyle}>
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Direction</label>
          <select value={newDir} onChange={(e) => setNewDir(e.target.value as 'buy' | 'sell')} style={selectStyle}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Strike</label>
          <select value={newStrike} onChange={(e) => setNewStrike(Number(e.target.value))} style={selectStyle}>
            {strikes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Qty</label>
          <input type="number" min={1} max={100} value={newQty} onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
            style={{ ...selectStyle, width: '60px' }} />
        </div>
        <button onClick={addLeg} style={{
          ...btnBase, background: 'rgba(29,185,84,0.1)', border: '1px solid rgba(29,185,84,0.2)', color: colors.green,
        }}>+ Add Leg</button>
        {positionLegs.length > 0 && (
          <button onClick={clearPositionLegs} style={{
            ...btnBase, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: colors.red,
          }}>Clear All</button>
        )}
      </div>

      {/* Legs Table */}
      {positionLegs.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={labelStyle}>Position Legs</span>
            <span style={{ fontSize: '12px', fontFamily: fonts.mono, fontWeight: 600, color: totalCost >= 0 ? colors.green : colors.red }}>
              Net {totalCost >= 0 ? 'Credit' : 'Debit'}: ${Math.abs(totalCost).toFixed(2)}
            </span>
          </div>
          <table style={baseTable}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderMedium}` }}>
                {['Direction', 'Side', 'Strike', 'Qty', 'Premium', 'Cost', ''].map((h) => (
                  <th key={h} style={baseTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positionLegs.map((leg) => {
                const cost = leg.premium * leg.quantity * (leg.direction === 'buy' ? -1 : 1);
                return (
                  <tr key={leg.id} style={baseTr}>
                    <td style={{ ...baseTd, fontWeight: 600, color: leg.direction === 'buy' ? colors.green : colors.red }}>
                      {leg.direction.toUpperCase()}
                    </td>
                    <td style={{ ...baseTd, color: leg.side === 'call' ? colors.green : colors.red }}>
                      {leg.side.toUpperCase()}
                    </td>
                    <td style={baseTd}>{leg.strike}</td>
                    <td style={baseTd}>{leg.quantity}</td>
                    <td style={baseTd}>${leg.premium.toFixed(2)}</td>
                    <td style={{ ...baseTd, fontWeight: 600, color: cost >= 0 ? colors.green : colors.red }}>
                      {cost >= 0 ? '+' : ''}${cost.toFixed(2)}
                    </td>
                    <td style={baseTd}>
                      <button onClick={() => removePositionLeg(leg.id)}
                        style={{ background: 'none', border: 'none', color: colors.textTertiary, cursor: 'pointer', fontSize: '12px' }}>
                        &#10005;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PayoffChart legs={positionLegs} />
    </div>
  );
}
