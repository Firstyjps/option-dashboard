import type { Exchange, OptionData, SideFilter } from '@/types/option';
import { EX_COLORS } from '@/constants/exchanges';
import { colors, fonts, baseTable, baseTh, baseTd, baseTr } from '@/styles/theme';

interface BestPriceFinderProps {
  data: OptionData[];
  selectedExchanges: Exchange[];
  side: SideFilter;
  underlyingPrice?: number;
}

export function BestPriceFinder({ data, selectedExchanges, side, underlyingPrice = 0 }: BestPriceFinderProps) {
  // Filter out outliers: only keep strikes within ±50% of underlying, with valid ask > 0
  const spotRef = underlyingPrice > 0 ? underlyingPrice : 80;
  const minStrike = spotRef * 0.5;
  const maxStrike = spotRef * 1.5;

  const byStrike: Record<number, OptionData[]> = {};
  data
    .filter((d) =>
      (side === 'both' || d.side === side) &&
      selectedExchanges.includes(d.exchange) &&
      d.strike >= minStrike &&
      d.strike <= maxStrike &&
      d.ask > 0
    )
    .forEach((d) => {
      if (!byStrike[d.strike]) byStrike[d.strike] = [];
      byStrike[d.strike].push(d);
    });

  const strikes = [...new Set(Object.keys(byStrike).map(Number))].sort((a, b) => a - b);

  const bestPrices = strikes.map((s) => {
    const opts = byStrike[s] || [];
    if (!opts.length) return null;
    const best = opts.reduce((a, b) => (a.ask < b.ask ? a : b));
    const worst = opts.reduce((a, b) => (a.ask > b.ask ? a : b));
    const saving = worst.ask - best.ask;
    // Skip if spread between best/worst is absurd (>500% of best ask)
    if (worst.ask > best.ask * 6) return null;
    return { strike: s, best, worst, saving, all: opts };
  }).filter(Boolean) as { strike: number; best: OptionData; worst: OptionData; saving: number; all: OptionData[] }[];

  const headers = ['Strike', 'Best Ask', 'Exchange', 'Worst Ask', 'Saving', 'IV Spread'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={baseTable}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.borderMedium}` }}>
            {headers.map((h) => (
              <th key={h} style={baseTh}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bestPrices.map(({ strike, best, worst, saving, all }) => {
            const isATM = underlyingPrice > 0 && Math.abs(strike - underlyingPrice) < 5;
            const ivs = all.map((d) => d.iv);
            const ivSpread = (Math.max(...ivs) - Math.min(...ivs)).toFixed(1);
            return (
              <tr key={strike} style={{
                ...baseTr,
                background: isATM ? colors.subtle : 'transparent',
              }}>
                <td style={{ ...baseTd, fontWeight: isATM ? 700 : 400, color: isATM ? '#fff' : colors.textSecondary }}>
                  {strike}{isATM && <span style={{ color: colors.green, fontSize: '9px', marginLeft: '6px' }}>ATM</span>}
                </td>
                <td style={{ ...baseTd, color: colors.green, fontWeight: 600 }}>${best.ask.toFixed(2)}</td>
                <td style={baseTd}>
                  <span style={{ color: EX_COLORS[best.exchange], fontSize: '11px' }}>{best.exchange}</span>
                </td>
                <td style={{ ...baseTd, color: colors.textTertiary }}>${worst.ask.toFixed(2)}</td>
                <td style={{ ...baseTd, color: saving > 0.5 ? colors.orange : colors.textFaint }}>
                  {saving > 0 ? `-$${saving.toFixed(2)}` : '\u2014'}
                </td>
                <td style={{ ...baseTd, color: parseFloat(ivSpread) > 3 ? colors.orange : colors.textTertiary }}>
                  {ivSpread}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
