import { fonts } from '@/styles/theme';

interface BadgeProps {
  children: React.ReactNode;
  color: string;
  active: boolean;
  onClick: () => void;
}

export function Badge({ children, color, active, onClick }: BadgeProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '6px',
        border: active ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
        background: active ? `${color}15` : 'rgba(255,255,255,0.03)',
        color: active ? color : 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: fonts.mono,
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </button>
  );
}
