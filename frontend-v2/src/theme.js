// Design tokens extracted from Figma (GgNiPSWQf4i99rKFdsDC3c)
export const tokens = {
  color: {
    bg: "#eff4f8",
    surface: "#ffffff",
    navy: "#041547",       // logo / primary
    navyDark: "#020a2b",
    text: "#282424",
    textSecondary: "#666666",
    placeholder: "#b3b3b3",
    border: "#d9d9d9",
    black: "#000000",
    star: "#ffc107",
    heart: "#e53935",
    success: { bg: "#e8f5e9", fg: "#2e7d32" },
    warning: { bg: "#fff3e0", fg: "#e65100" },
    danger:  { bg: "#ffebee", fg: "#c62828" },
  },
  shadow: {
    nav: "0px 2px 4px 0px rgba(0,0,0,0.1)",
    card: "0px 4px 4px 0px rgba(0,0,0,0.25)",
    pill: "2px 2px 10px 0px rgba(0,0,0,0.1)",
  },
  font: {
    logo: "'Lemon', 'Georgia', serif",
    base: "'Inter','Noto Sans TC',sans-serif",
    heading: "'Roboto','Noto Sans TC',sans-serif",
  },
  // Canonical text size scale. Use these for ALL text so each page keeps a
  // clear, limited hierarchy (caption < body < subtitle < title < heading).
  // NOTE: these are for TEXT only — never use them to size MUI icons.
  fontSize: {
    caption: 12,   // timestamps, hints, counts, small meta labels
    body: 14,      // default body / content text
    subtitle: 16,  // emphasized body, field labels, list items
    title: 20,     // card & section titles, user names, dialog titles
    heading: 28,   // page-level headings (use { xs: 22, md: 28 } when responsive)
  },
  radius: {
    sm: 8,
    md: 12,
    pill: 9999,
  },
  navHeight: 76,
};
