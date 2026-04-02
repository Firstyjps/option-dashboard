import { useState, useEffect } from 'react';
import type { Exchange, Asset } from '@/types/option';
import { fonts, colors } from '@/styles/theme';

interface HeaderProps {
  asset: Asset;
  underlyingPrice: number;
  isLive: boolean;
  isLoading: boolean;
  lastUpdate: Date | null;
  errors: { exchange: Exchange; error: string }[];
  onRefresh: () => void;
}

export function Header({ asset, underlyingPrice, isLive, isLoading, lastUpdate, errors, onRefresh }: HeaderProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeAgo = lastUpdate
    ? `${Math.round((now - lastUpdate.getTime()) / 1000)}s ago`
    : '';

  return (
    <div style={{
      padding: '20px 28px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #1DB954, #0d8a3e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 800, fontFamily: fonts.mono,
        }}>&#9678;</div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>Options Scanner</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: fonts.mono }}>
            Multi-Exchange Aggregator
            {lastUpdate && <> &bull; Updated {timeAgo}</>}
            {errors.length > 0 && (
              <span style={{ color: colors.orange }}> &bull; {errors.length} exchange{errors.length > 1 ? 's' : ''} offline</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          padding: '8px 16px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: fonts.mono, fontSize: '14px', fontWeight: 600,
        }}>
          {asset} <span style={{ color: '#1DB954' }}>${underlyingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        <button onClick={onRefresh} style={{
          padding: '6px 12px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: fonts.mono,
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {isLoading ? '...' : '\u21BB'}
        </button>

        <div style={{
          padding: '6px 12px', borderRadius: '6px',
          background: isLive ? 'rgba(29,185,84,0.1)' : 'rgba(247,166,0,0.1)',
          border: isLive ? '1px solid rgba(29,185,84,0.2)' : '1px solid rgba(247,166,0,0.2)',
          color: isLive ? '#1DB954' : '#F7A600',
          fontSize: '11px', fontFamily: fonts.mono,
        }}>
          &#9679; {isLive ? 'LIVE' : 'MOCK DATA'}
        </div>
      </div>
    </div>
  );
}
