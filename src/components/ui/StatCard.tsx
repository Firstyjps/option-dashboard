import { fonts } from '@/styles/theme';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '16px 20px',
      flex: '1 1 180px',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', fontFamily: fonts.mono }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: accent || '#fff', fontFamily: fonts.mono }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}
