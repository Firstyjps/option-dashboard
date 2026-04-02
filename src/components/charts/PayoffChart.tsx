import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { PositionLeg } from '@/types/option';
import { UNDERLYING } from '@/constants/strikes';
import { colors, fonts } from '@/styles/theme';

interface PayoffChartProps {
  legs: PositionLeg[];
}

function calculatePayoff(legs: PositionLeg[], spotPrice: number): number {
  return legs.reduce((total, leg) => {
    const dir = leg.direction === 'buy' ? 1 : -1;
    const payoff = leg.side === 'call'
      ? Math.max(0, spotPrice - leg.strike) - leg.premium
      : Math.max(0, leg.strike - spotPrice) - leg.premium;
    return total + payoff * dir * leg.quantity;
  }, 0);
}

export function PayoffChart({ legs }: PayoffChartProps) {
  if (!legs.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', color: colors.textTertiary, fontFamily: fonts.mono, fontSize: '13px' }}>
        Add legs to see the payoff diagram
      </div>
    );
  }

  const strikes = legs.map((l) => l.strike);
  const minStrike = Math.min(...strikes, UNDERLYING) * 0.7;
  const maxStrike = Math.max(...strikes, UNDERLYING) * 1.3;
  const step = (maxStrike - minStrike) / 100;

  const chartData = [];
  for (let price = minStrike; price <= maxStrike; price += step) {
    chartData.push({ price: +price.toFixed(2), pnl: +calculatePayoff(legs, price).toFixed(2) });
  }

  const maxProfit = Math.max(...chartData.map((d) => d.pnl));
  const maxLoss = Math.min(...chartData.map((d) => d.pnl));
  const breakevens = chartData.filter((d, i) => {
    if (i === 0) return false;
    return (chartData[i - 1].pnl < 0 && d.pnl >= 0) || (chartData[i - 1].pnl > 0 && d.pnl <= 0);
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '12px', fontFamily: fonts.mono }}>
        <span style={{ color: colors.green }}>
          Max Profit: {maxProfit > 1000 ? 'Unlimited' : `$${maxProfit.toFixed(2)}`}
        </span>
        <span style={{ color: colors.red }}>
          Max Loss: ${maxLoss.toFixed(2)}
        </span>
        {breakevens.length > 0 && (
          <span style={{ color: colors.textTertiary }}>
            Breakeven: {breakevens.map((b) => `$${b.price}`).join(', ')}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1DB954" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1DB954" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="price"
            stroke="rgba(255,255,255,0.3)"
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          <ReferenceLine
            x={UNDERLYING}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 4"
            label={{ value: `Spot $${UNDERLYING}`, position: 'top', fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
          />
          <Tooltip
            contentStyle={{ background: '#141415', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            labelFormatter={(v: number) => `Spot: $${v}`}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
          />
          <Area type="monotone" dataKey="pnl" stroke="#1DB954" strokeWidth={2} fill="url(#profitGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
