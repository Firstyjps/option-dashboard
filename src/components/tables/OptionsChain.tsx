import type { Exchange, OptionData } from '@/types/option';
import { EX_COLORS } from '@/constants/exchanges';
import { MiniBar } from '@/components/ui/MiniBar';
import { colors, fonts, baseTable, baseTr } from '@/styles/theme';

interface OptionsChainProps {
  data: OptionData[];
  selectedExchanges: Exchange[];
  strike: number;
}

const td: React.CSSProperties = { padding: '8px 10px' };

function ChainTable({ options, label, color }: { options: OptionData[]; label: string; color: string }) {
  const headers = ['Exchange', 'Bid', 'Size', 'Ask', 'Size', 'Mark', 'IV', 'Delta', 'OI', ''];

  return (
    <div>
      <div style={{ fontSize: '11px', color, fontWeight: 600, marginBottom: '8px', letterSpacing: '1px', fontFamily: fonts.mono }}>
        {label}
      </div>
      <table style={baseTable}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.borderMedium}` }}>
            {headers.map((h, i) => (
              <th key={`${h}-${i}`} style={{ ...td, textAlign: 'left' as const, color: colors.textFaint, fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map((d) => (
            <tr key={d.exchange} style={baseTr}>
              <td style={td}>
                <span style={{ color: EX_COLORS[d.exchange], fontWeight: 600, fontSize: '11px' }}>{d.exchange}</span>
              </td>
              <td style={{ ...td, color: colors.green }}>{d.bid.toFixed(2)}</td>
              <td style={{ ...td, color: colors.textFaint, fontSize: '10px' }}>{d.size_bid}</td>
              <td style={{ ...td, color: colors.red }}>{d.ask.toFixed(2)}</td>
              <td style={{ ...td, color: colors.textFaint, fontSize: '10px' }}>{d.size_ask}</td>
              <td style={{ ...td, fontWeight: 600 }}>{d.mark.toFixed(2)}</td>
              <td style={{ ...td, color: colors.textSecondary }}>{d.iv.toFixed(1)}%</td>
              <td style={{ ...td, color: d.delta > 0 ? colors.green : colors.red }}>{d.delta.toFixed(3)}</td>
              <td style={{ ...td, color: colors.textTertiary }}>{d.oi.toLocaleString()}</td>
              <td style={td}><MiniBar value={d.oi} max={1600} color={EX_COLORS[d.exchange]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OptionsChain({ data, selectedExchanges, strike }: OptionsChainProps) {
  const calls = data.filter((d) => d.side === 'call' && d.strike === strike && selectedExchanges.includes(d.exchange));
  const puts = data.filter((d) => d.side === 'put' && d.strike === strike && selectedExchanges.includes(d.exchange));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <ChainTable options={calls} label="CALLS" color="#1DB954" />
      <ChainTable options={puts} label="PUTS" color="#ef4444" />
    </div>
  );
}
