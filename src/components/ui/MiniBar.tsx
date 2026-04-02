interface MiniBarProps {
  value: number;
  max: number;
  color: string;
}

export function MiniBar({ value, max, color }: MiniBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
    </div>
  );
}
