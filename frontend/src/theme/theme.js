export const colors = {
  // Base
  background: '#0A0D16',
  surface: '#111624',
  card: '#161C2E',
  cardLight: '#1C2438',
  border: 'rgba(212, 175, 55, 0.14)',
  borderSubtle: 'rgba(255,255,255,0.06)',

  // Dorado premium
  gold: '#D4AF37',
  goldLight: '#F0D98C',
  goldDark: '#9C7C1E',
  goldSoft: 'rgba(212, 175, 55, 0.12)',

  // Texto
  text: '#F4F6FB',
  textSecondary: '#8B93A7',
  textMuted: '#5A6172',

  // Estados
  success: '#3DD68C',
  successSoft: 'rgba(61, 214, 140, 0.12)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.12)',
  info: '#5BA4F5',
  infoSoft: 'rgba(91, 164, 245, 0.12)',
};

export const gradients = {
  gold: ['#F0D98C', '#D4AF37', '#A8842A'],
  dark: ['#1C2438', '#111624'],
  card: ['#1A2136', '#141A2B'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const type = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '500' },
  small: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
};

export const shadow = {
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};
