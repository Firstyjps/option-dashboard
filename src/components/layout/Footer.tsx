import { fonts } from '@/styles/theme';

export function Footer() {
  return (
    <div style={{
      marginTop: '20px', padding: '16px 20px',
      background: 'rgba(247,166,0,0.04)', border: '1px solid rgba(247,166,0,0.1)',
      borderRadius: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)',
      lineHeight: '1.6', fontFamily: fonts.mono,
    }}>
      <span style={{ color: '#F7A600', fontWeight: 600 }}>&#9888; DISCLAIMER</span>
      {' '}&mdash; ข้อมูลนี้เป็น Mock Data สร้างจาก model ไม่ใช่ราคาจริง ใช้เพื่อสาธิตโครงสร้าง Dashboard เท่านั้น
      ในการใช้งานจริงต้องเชื่อมต่อ API ของแต่ละ exchange (Deribit, Binance, Bybit, OKX) เพื่อดึงข้อมูล real-time
    </div>
  );
}
