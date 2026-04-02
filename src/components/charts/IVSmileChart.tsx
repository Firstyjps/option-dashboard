import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Exchange, OptionData, SideFilter } from '@/types/option';
import { EX_COLORS } from '@/constants/exchanges';

interface IVSmileChartProps {
  data: OptionData[];
  selectedExchanges: Exchange[];
  side: SideFilter;
}

const tooltipStyle = {
  contentStyle: {
    background: '#141415',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  labelStyle: { color: '#fff', fontWeight: 600, marginBottom: '4px' },
};

export function IVSmileChart({ data, selectedExchanges, side }: IVSmileChartProps) {
  const filtered = data.filter(
    (d) => (side === 'both' || d.side === side) && selectedExchanges.includes(d.exchange)
  );
  if (!filtered.length) return null;

  // Derive strikes from data
  const strikes = [...new Set(filtered.map((d) => d.strike))].sort((a, b) => a - b);

  const chartData = strikes.map((strike) => {
    const point: Record<string, number> = { strike };
    selectedExchanges.forEach((ex) => {
      const opt = filtered.find((d) => d.strike === strike && d.exchange === ex);
      if (opt) point[ex] = opt.iv;
    });
    return point;
  });

  // Find ATM strike (closest to median strike price)
  const allStrikes = strikes;
  const medianIdx = Math.floor(allStrikes.length / 2);
  const atmStrike = allStrikes[medianIdx] || allStrikes[0];

  // Auto-scale Y axis
  const allIVs = filtered.map((d) => d.iv).filter((v) => v > 0);
  const ivMin = Math.floor(Math.min(...allIVs) - 2);
  const ivMax = Math.ceil(Math.max(...allIVs) + 2);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="strike"
          stroke="rgba(255,255,255,0.3)"
          fontSize={10}
          fontFamily="JetBrains Mono"
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.3)"
          fontSize={10}
          fontFamily="JetBrains Mono"
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickFormatter={(v: number) => `${v}%`}
          domain={[ivMin, ivMax]}
        />
        <ReferenceLine
          x={atmStrike}
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 4"
          label={{ value: 'ATM', position: 'top', fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
        />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(v: number) => `Strike: ${v}`}
          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
        />
        {selectedExchanges.map((ex) => (
          <Line
            key={ex}
            type="monotone"
            dataKey={ex}
            stroke={EX_COLORS[ex]}
            strokeWidth={2}
            dot={{ r: 3, fill: EX_COLORS[ex], strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
