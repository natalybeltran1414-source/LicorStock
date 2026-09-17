import { spacing, radius, type } from './theme';

// Paletas con contraste verificado WCAG AA (texto >= 4.5:1 sobre su fondo).
export const PALETAS = {
  oscuro: {
    esOscuro: true,

    // Base
    background: '#0B0E17',
    surface: '#121726',
    card: '#171D30',
    cardLight: '#1D2540',
    border: 'rgba(217, 180, 74, 0.18)',
    borderSubtle: 'rgba(255,255,255,0.07)',

    // Dorado premium
    gold: '#D9B44A',
    goldLight: '#F0D98C',
    goldDark: '#9C7C1E',
    goldSoft: 'rgba(217, 180, 74, 0.14)',
    sobreDorado: '#241B04',

    // Texto (sobre card #171D30)
    text: '#F5F7FC',
    textSecondary: '#A7AEC1',
    textMuted: '#8B93A8',

    // Estados
    success: '#4ADE8F',
    successSoft: 'rgba(74, 222, 143, 0.13)',
    warning: '#FFB020',
    warningSoft: 'rgba(255, 176, 32, 0.13)',
    danger: '#FF7A7A',
    dangerSoft: 'rgba(255, 122, 122, 0.13)',
    info: '#6FB3FF',
    infoSoft: 'rgba(111, 179, 255, 0.13)',

    gradients: {
      gold: ['#F0D98C', '#D4AF37', '#A8842A'],
      dark: ['#1C2438', '#111624'],
      card: ['#1A2136', '#141A2B'],
    },

    shadow: {
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
    },
  },

  claro: {
    esOscuro: false,

    // Base
    background: '#F4F6FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardLight: '#EDF0F7',
    border: 'rgba(140, 109, 31, 0.28)',
    borderSubtle: '#E4E8F0',

    // Dorado accesible sobre claro
    gold: '#8C6D1F',
    goldLight: '#7A5E14',
    goldDark: '#6E5512',
    goldSoft: 'rgba(140, 109, 31, 0.12)',
    sobreDorado: '#241B04',

    // Texto (sobre blanco)
    text: '#1B2233',
    textSecondary: '#45506B',
    textMuted: '#5D6780',

    // Estados
    success: '#147A4E',
    successSoft: 'rgba(20, 122, 78, 0.10)',
    warning: '#9A6200',
    warningSoft: 'rgba(154, 98, 0, 0.10)',
    danger: '#C03636',
    dangerSoft: 'rgba(192, 54, 54, 0.10)',
    info: '#1D5FBF',
    infoSoft: 'rgba(29, 95, 191, 0.10)',

    gradients: {
      gold: ['#F3D98B', '#DDAF3F', '#B98A20'],
      dark: ['#FFFFFF', '#E7EBF3'],
      card: ['#FFFFFF', '#F3F5FA'],
    },

    shadow: {
      gold: {
        shadowColor: '#B98A20',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
      },
      card: {
        shadowColor: '#1B2233',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    },
  },
};

export { spacing, radius, type };
