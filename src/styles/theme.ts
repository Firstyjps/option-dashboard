export const colors = {
  bg: '#0a0a0b',
  card: 'rgba(255,255,255,0.02)',
  cardHover: 'rgba(255,255,255,0.04)',
  subtle: 'rgba(255,255,255,0.03)',
  panel: 'rgba(255,255,255,0.015)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderMedium: 'rgba(255,255,255,0.08)',
  text: '#fff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.4)',
  textMuted: 'rgba(255,255,255,0.35)',
  textFaint: 'rgba(255,255,255,0.3)',
  green: '#1DB954',
  greenDim: 'rgba(29,185,84,0.1)',
  greenBorder: 'rgba(29,185,84,0.2)',
  greenBg: 'rgba(29,185,84,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',
  yellow: '#F0B90B',
  orange: '#F7A600',
  orangeDim: 'rgba(247,166,0,0.04)',
  orangeBorder: 'rgba(247,166,0,0.1)',
} as const;

export const fonts = {
  mono: "'JetBrains Mono', monospace",
  sans: "'Inter', -apple-system, sans-serif",
} as const;

export const baseLabel: React.CSSProperties = {
  fontSize: '11px',
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  fontFamily: fonts.mono,
};

export const baseTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
  fontFamily: fonts.mono,
};

export const baseTh: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  color: colors.textMuted,
  fontWeight: 500,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

export const baseTd: React.CSSProperties = {
  padding: '10px 12px',
};

export const baseTr: React.CSSProperties = {
  borderBottom: `1px solid ${colors.borderSubtle}`,
};
