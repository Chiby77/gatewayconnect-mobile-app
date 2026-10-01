// Design tokens — mirrors gatewayconnect.joedaniels.org's dark theme (src/index.css) exactly,
// pulled from the site's own source so the app and the website read as one brand.
export const Colors = {
  // Backgrounds (site: --background / --card / --secondary / --muted)
  bg: '#0b0f19',
  bgCard: '#131d31',
  bgSecondary: '#1a253c',
  bgMuted: '#141e32',

  // Chat bubbles — the site hardcodes WhatsApp's own dark-mode hex values for its chat UI
  // (not its blue --primary); kept under the old `forestGreen*` names so nothing else changes.
  forestGreen: '#005c4b', // outgoing bubble (WhatsApp dark "sent")
  forestGreenLight: '#1f6f5c', // outgoing bubble, attachment/media variant (lightened for contrast)
  whatsappIncoming: '#202c33', // incoming bubble (WhatsApp dark "received")
  whatsappText: '#e9edef', // WhatsApp's own off-white bubble text

  // IG-blue primary (site: --primary) — social/interactive layer: Follow button, links, active
  // tab/segment state, verified-badge ring. Distinct from the church-gold brand accent below.
  primary: '#0095f6',
  primaryMuted: 'rgba(0,149,246,0.16)',

  // Gold accent — church brand (site: --church-gold), used for Give/donate, badges, highlights
  gold: '#f59e0b',
  goldDark: '#d97706',
  goldMuted: 'rgba(245,158,11,0.18)',

  // Text (site: --foreground / --muted-foreground)
  textPrimary: '#f8fafc',
  textSecondary: '#a1a1aa',
  textMuted: '#94a3b8',
  textInverse: '#0b0f19',

  // Semantic (site: --destructive is rose-500, not red-500)
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#f43f5e',
  dangerMuted: 'rgba(244,63,94,0.14)',

  // Borders (site: --border / --border-strong)
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // Highlights (Bible)
  highlightGold: 'rgba(245,158,11,0.25)',
  highlightEmerald: 'rgba(52,211,153,0.25)',
  highlightBlue: 'rgba(56,189,248,0.25)',
  highlightRose: 'rgba(244,63,94,0.25)',
};

export const Typography = {
  fontRegular: 'Inter_400Regular',
  fontSemiBold: 'Inter_600SemiBold',
  fontBold: 'Inter_800ExtraBold',
};

export const Radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};
