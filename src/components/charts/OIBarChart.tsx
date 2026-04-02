import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Exchange, OptionData, OptionSide } from '@/types/option';
import { EX_COLORS } from '@/constants/exchanges';

interface OIBarChartProps {
  data: OptionData[];
  selectedExchanges: Exchange[];
  side: OptionSide;
}

export function OIBarChart({ data, selectedExchanges, side }: OIBarChartProps) {
  const filtered = data.filter(
    (d) => d.side === side && selectedExchanges.includes(d.exchange)
  );

  const strikes = [...new Set(filtered.map((d) => d.strike))].sort((a, b) => a - b);

  const chartData = strikes.map((strike) => {
    const point: Record<string, number> = { strike };
    selectedExchanges.forEach((ex) => {
      const opt = filtered.find((d) => d.strike === strike && d.exchange === ex);
      if (opt) point[ex] = opt.oi;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
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
        />
        <Tooltip
          contentStyle={{
            background: '#141415',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}
          labelFormatter={(v: number) => `Strike: ${v}`}
        />
        {selectedExchanges.map((ex) => (
          <Bar
            key={ex}
            dataKey={ex}
            fill={EX_COLORS[ex]}
            opacity={0.75}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
