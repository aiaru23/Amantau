export const ThemeColors = {
  background: '#0E1411',
  navDark: '#121A16',
  cardBg: '#151E19',
  cardBgSubtle: '#111814',
  cardBorder: '#202E26',
  cardBorderHighlight: '#2E4237',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textHeader: '#FFFFFF',

  accentGreen: '#10B981',
  accentLime: '#10B981',
  accentLimeBright: '#059669',

  safeGreen: '#10B981',
  warningYellow: '#D97706',
  dangerRed: '#DC2626',
  sosRed: '#DC2626',

  buttonPrimaryBg: '#10B981',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#1B2721',
  buttonSecondaryText: '#F8FAFC',
  buttonDangerBg: '#DC2626',
  buttonDangerText: '#FFFFFF',

  online: '#10B981',
  offline: '#64748B',
};

export type ThemeColor = keyof typeof ThemeColors;

export const Colors = {
  light: {
    text: '#F8FAFC',
    background: '#0E1411',
    tint: '#10B981',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#10B981',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0E1411',
    tint: '#10B981',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#10B981',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const MaxContentWidth = 1200;
export const BottomTabInset = 0;

export const Fonts = {
  bold: 'System',
  semiBold: 'System',
  medium: 'System',
  regular: 'System',
  mono: 'System',
};
