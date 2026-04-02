import type { TabId } from '@/types/option';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'best', label: 'Best Price' },
  { id: 'iv', label: 'IV Smile' },
  { id: 'oi', label: 'Open Interest' },
  { id: 'chain', label: 'Chain Compare' },
  { id: 'arbitrage', label: 'Arbitrage' },
  { id: 'position', label: 'Position Builder' },
  { id: 'greeks', label: 'Greeks Calc' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div style={{
      display: 'flex', gap: '0', marginBottom: '20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      overflowX: 'auto',
    }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === t.id ? '2px solid #1DB954' : '2px solid transparent',
            color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: '13px',
            fontWeight: activeTab === t.id ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'Inter', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
