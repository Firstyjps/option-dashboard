import type { Exchange } from '@/types/option';
import { EX_COLORS } from '@/constants/exchanges';
import { fonts } from '@/styles/theme';

interface LegendProps {
  exchanges: Exchange[];
}

export function Legend({ exchanges }: LegendProps) {
  return (
    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
      {exchanges.map((ex) => (
        <div key={ex} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: EX_COLORS[ex] }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: fonts.mono }}>{ex}</span>
        </div>
      ))}
    </div>
  );
}
