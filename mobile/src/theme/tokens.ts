// SarkinMota design tokens. Gold sampled from the SarkinMota Autos logo; dark-only UI.
export const colors = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  separator: 'rgba(84,84,88,0.6)',
  gold: '#D6B548',
  goldHighlight: '#E4C461',
  goldMuted: '#A88A2C',
  text: '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.6)',
  textTertiary: 'rgba(235,235,245,0.3)',
  success: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',
  glassFallback: 'rgba(28,28,30,0.85)',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

export const radius = { card: 12, tile: 16, sheet: 20, pill: 999 } as const;

export const type = {
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  title1: { fontSize: 28, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  title3: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  callout: { fontSize: 16, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  footnote: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const;

export const screenPadding = space.xl;
