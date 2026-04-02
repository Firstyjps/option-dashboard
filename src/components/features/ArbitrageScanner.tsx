import { useMemo } from 'react';
import type { Exchange, OptionData, ArbitrageOpportunity } from '@/types/option';
import { EX_COLORS } from '@/constants/exchanges';
import { colors, fonts, baseTable, baseTh, baseTd, baseTr } from '@/styles/theme';

interface ArbitrageScannerProps {
  data: OptionData[];
  selectedExchanges: Exchange[];
}

function findArbitrage(data: OptionData[], selectedExchanges: Exchange[]): ArbitrageOpportunity[] {
  const filtered = data.filter((d) => selectedExchanges.includes(d.exchange));
  const grouped: Record<string, OptionData[]> = {};
  filtered.forEach((d) => {
    const key = `${d.strike}-${d.side}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  const opps: ArbitrageOpportunity[] = [];
  Object.values(grouped).forEach((opts) => {
    for (let i = 0; i < opts.length; i++) {
      for (let j = 0; j < opts.length; j++) {
        if (i === j) continue;
        const seller = opts[i], buyer = opts[j];
        if (seller.bid > buyer.ask && buyer.ask > 0) {
          opps.push({
            strike: seller.strike,
            side: seller.side,
            buyExchange: buyer.exchange,
            buyAsk: buyer.ask,
            sellExchange: seller.exchange,
            sellBid: seller.bid,
            spread: seller.bid - buyer.ask,
            spreadPercent: ((seller.bid - buyer.ask) / buyer.ask) * 100,
          });
        }
      }
    }
  });
  return opps.sort((a, b) => b.spreadPercent - a.spreadPercent);
}

function findNearArbitrage(data: OptionData[], selectedExchanges: Exchange[]) {
  const filtered = data.filter((d) => selectedExchanges.includes(d.exchange));
  const grouped: Record<string, OptionData[]> = {};
  filtered.forEach((d) => {
    const key = `${d.strike}-${d.side}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  const near: (ArbitrageOpportunity & { gap: number })[] = [];
  Object.values(grouped).forEach((opts) => {
    for (let i = 0; i < opts.length; i++) {
      for (let j = i + 1; j < opts.length; j++) {
        const a = opts[i], b = opts[j];
        const gap1 = a.bid - b.ask, gap2 = b.bid - a.ask;
        const bestGap = Math.max(gap1, gap2);
        if (bestGap > -0.5 && bestGap <= 0) {
          const buyer = gap1 > gap2 ? b : a;
          const seller = gap1 > gap2 ? a : b;
          near.push({
            strike: a.strike, side: a.side,
            buyExchange: buyer.exchange, buyAsk: buyer.ask,
            sellExchange: seller.exchange, sellBid: seller.bid,
            spread: bestGap, spreadPercent: (bestGap / buyer.ask) * 100, gap: bestGap,
          });
        }
      }
    }
  });
  return near.sort((a, b) => b.gap - a.gap).slice(0, 10);
}

export function ArbitrageScanner({ data, selectedExchanges }: ArbitrageScannerProps) {
  const opportunities = useMemo(() => findArbitrage(data, selectedExchanges), [data, selectedExchanges]);
  const nearArbitrage = useMemo(() => findNearArbitrage(data, selectedExchanges), [data, selectedExchanges]);

  const badge = (count: number, hasItems: boolean): React.CSSProperties => ({
    padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: fonts.mono, fontWeight: 600,
    background: hasItems ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.03)',
    color: hasItems ? colors.green : colors.textTertiary,
  });

  const headers1 = ['Strike', 'Side', 'Buy From', 'Ask', 'Sell To', 'Bid', 'Spread', '%'];
  const headers2 = ['Strike', 'Side', 'Buy From', 'Ask', 'Sell To', 'Bid', 'Gap'];

  return (
    <div>
      {/* Direct */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Direct Arbitrage Opportunities</span>
          <span style={badge(opportunities.length, opportunities.length > 0)}>{opportunities.length} found</span>
        </div>
        {opportunities.length > 0 ? (
          <table style={baseTable}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderMedium}` }}>
                {headers1.map((h) => <th key={h} style={baseTh}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o, i) => (
                <tr key={i} style={baseTr}>
                  <td style={{ ...baseTd, fontWeight: 600 }}>{o.strike}</td>
                  <td style={{ ...baseTd, color: o.side === 'call' ? colors.green : colors.red }}>{o.side.toUpperCase()}</td>
                  <td style={baseTd}><span style={{ color: EX_COLORS[o.buyExchange] }}>{o.buyExchange}</span></td>
                  <td style={{ ...baseTd, color: colors.green }}>${o.buyAsk.toFixed(2)}</td>
                  <td style={baseTd}><span style={{ color: EX_COLORS[o.sellExchange] }}>{o.sellExchange}</span></td>
                  <td style={{ ...baseTd, color: colors.red }}>${o.sellBid.toFixed(2)}</td>
                  <td style={{ ...baseTd, color: colors.orange, fontWeight: 600 }}>${o.spread.toFixed(2)}</td>
                  <td style={{ ...baseTd, color: colors.orange }}>{o.spreadPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: colors.textTertiary, fontSize: '13px' }}>
            No direct arbitrage opportunities found at this moment.
          </div>
        )}
      </div>

      {/* Near */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Near Arbitrage (within $0.50)</span>
          <span style={badge(nearArbitrage.length, false)}>{nearArbitrage.length} found</span>
        </div>
        {nearArbitrage.length > 0 ? (
          <table style={baseTable}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderMedium}` }}>
                {headers2.map((h) => <th key={h} style={baseTh}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {nearArbitrage.map((o, i) => (
                <tr key={i} style={baseTr}>
                  <td style={{ ...baseTd, fontWeight: 600 }}>{o.strike}</td>
                  <td style={{ ...baseTd, color: o.side === 'call' ? colors.green : colors.red }}>{o.side.toUpperCase()}</td>
                  <td style={baseTd}><span style={{ color: EX_COLORS[o.buyExchange] }}>{o.buyExchange}</span></td>
                  <td style={baseTd}>${o.buyAsk.toFixed(2)}</td>
                  <td style={baseTd}><span style={{ color: EX_COLORS[o.sellExchange] }}>{o.sellExchange}</span></td>
                  <td style={baseTd}>${o.sellBid.toFixed(2)}</td>
                  <td style={{ ...baseTd, color: colors.yellow }}>${o.gap.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: colors.textTertiary, fontSize: '13px' }}>
            No near-arbitrage opportunities found.
          </div>
        )}
      </div>
    </div>
  );
}
