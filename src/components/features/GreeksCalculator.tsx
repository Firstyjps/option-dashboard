import { useState, useMemo, useEffect } from 'react';
import type { OptionSide } from '@/types/option';
import { colors, fonts } from '@/styles/theme';

interface GreeksCalculatorProps {
  underlyingPrice?: number;
}

function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * ax);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1.0 + sign * y);
}

function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

interface BSResult { price: number; delta: number; gamma: number; theta: number; vega: number; rho: number; }

function blackScholes(spot: number, strike: number, t: number, iv: number, r: number, side: OptionSide): BSResult {
  if (t <= 0 || iv <= 0) {
    const intr = side === 'call' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
    return { price: intr, delta: side === 'call' ? (spot > strike ? 1 : 0) : (spot < strike ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0 };
  }
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(spot / strike) + (r + 0.5 * iv * iv) * t) / (iv * sqrtT);
  const d2 = d1 - iv * sqrtT;
  let price: number, delta: number, rho: number;
  if (side === 'call') {
    price = spot * normCDF(d1) - strike * Math.exp(-r * t) * normCDF(d2);
    delta = normCDF(d1);
    rho = strike * t * Math.exp(-r * t) * normCDF(d2) / 100;
  } else {
    price = strike * Math.exp(-r * t) * normCDF(-d2) - spot * normCDF(-d1);
    delta = normCDF(d1) - 1;
    rho = -strike * t * Math.exp(-r * t) * normCDF(-d2) / 100;
  }
  const gamma = normPDF(d1) / (spot * iv * sqrtT);
  const theta = (-(spot * normPDF(d1) * iv) / (2 * sqrtT) - r * strike * Math.exp(-r * t) * normCDF(side === 'call' ? d2 : -d2) * (side === 'call' ? 1 : -1)) / 365;
  const vega = spot * normPDF(d1) * sqrtT / 100;
  return { price, delta, gamma, theta, vega, rho };
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a0b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '13px',
  fontFamily: fonts.mono,
  color: '#fff',
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', color: colors.textMuted,
  textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '4px', fontFamily: fonts.mono,
};

export function GreeksCalculator({ underlyingPrice = 80 }: GreeksCalculatorProps) {
  const [spot, setSpot] = useState(underlyingPrice);
  const [strike, setStrike] = useState(underlyingPrice);
  const [dte, setDte] = useState(30);
  const [iv, setIV] = useState(65);

  // Sync spot/strike when underlying changes (e.g. switching asset)
  useEffect(() => {
    setSpot(underlyingPrice);
    setStrike(underlyingPrice);
  }, [underlyingPrice]);
  const [rf, setRf] = useState(5);
  const [side, setSide] = useState<OptionSide>('call');

  const result = useMemo(() => blackScholes(spot, strike, dte / 365, iv / 100, rf / 100, side), [spot, strike, dte, iv, rf, side]);

  const spotSteps = [-10, -5, -2, 0, 2, 5, 10];
  const ivSteps = [-10, -5, 0, 5, 10];

  const sensitivity = useMemo(() =>
    ivSteps.map((ivD) => ({
      ivLabel: `${iv + ivD}%`,
      isCurrent: ivD === 0,
      values: spotSteps.map((sD) => {
        const s = spot + sD, v = (iv + ivD) / 100;
        if (v <= 0 || s <= 0) return { price: 0, isCurrent: sD === 0 && ivD === 0 };
        return { price: blackScholes(s, strike, dte / 365, v, rf / 100, side).price, isCurrent: sD === 0 && ivD === 0 };
      }),
    })),
    [spot, strike, dte, iv, rf, side]
  );

  const greeks = [
    { label: 'Price', value: `$${result.price.toFixed(4)}`, color: '#fff' },
    { label: 'Delta', value: result.delta.toFixed(4), color: result.delta > 0 ? colors.green : colors.red },
    { label: 'Gamma', value: result.gamma.toFixed(6), color: colors.yellow },
    { label: 'Theta', value: result.theta.toFixed(4), color: colors.red },
    { label: 'Vega', value: result.vega.toFixed(4), color: colors.orange },
    { label: 'Rho', value: result.rho.toFixed(4), color: colors.textSecondary },
  ];

  return (
    <div>
      {/* Inputs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px',
        marginBottom: '24px', padding: '16px 18px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div><label style={labelStyle}>Side</label>
          <select value={side} onChange={(e) => setSide(e.target.value as OptionSide)} style={inputStyle}>
            <option value="call">Call</option><option value="put">Put</option>
          </select>
        </div>
        <div><label style={labelStyle}>Spot</label>
          <input type="number" step="0.5" value={spot} onChange={(e) => setSpot(Number(e.target.value))} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Strike</label>
          <input type="number" step="5" value={strike} onChange={(e) => setStrike(Number(e.target.value))} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>DTE</label>
          <input type="number" min={1} value={dte} onChange={(e) => setDte(Number(e.target.value))} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>IV (%)</label>
          <input type="number" step="1" value={iv} onChange={(e) => setIV(Number(e.target.value))} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Risk-Free (%)</label>
          <input type="number" step="0.25" value={rf} onChange={(e) => setRf(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      {/* Greeks Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {greeks.map((g) => (
          <div key={g.label} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '14px 18px',
          }}>
            <div style={{ fontSize: '10px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '6px', fontFamily: fonts.mono }}>
              {g.label}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: fonts.mono, color: g.color }}>
              {g.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sensitivity */}
      <div>
        <div style={{ fontSize: '10px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '10px', fontFamily: fonts.mono }}>
          Price Sensitivity (Spot vs IV)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: fonts.mono }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderMedium}` }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: colors.textMuted, fontSize: '10px' }}>IV \ Spot</th>
                {spotSteps.map((s) => (
                  <th key={s} style={{ padding: '8px 10px', textAlign: 'center', color: s === 0 ? colors.green : colors.textMuted, fontSize: '10px' }}>
                    ${(spot + s).toFixed(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr key={row.ivLabel} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 500, color: row.isCurrent ? colors.green : colors.textTertiary }}>
                    {row.ivLabel}
                  </td>
                  {row.values.map((cell, i) => (
                    <td key={i} style={{
                      padding: '8px 10px', textAlign: 'center',
                      color: cell.isCurrent ? colors.green : colors.textSecondary,
                      fontWeight: cell.isCurrent ? 600 : 400,
                      background: cell.isCurrent ? 'rgba(29,185,84,0.08)' : 'transparent',
                    }}>
                      {cell.price.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
