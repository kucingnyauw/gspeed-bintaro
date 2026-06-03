/**
 * @module Typographies
 * @description Style typography untuk Neo Brutalism.
 * Bold weight, uppercase untuk heading, font Lexend/Public Sans.
 */
const Typographies = {
    fontFamily: "'Lexend', 'Public Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    htmlFontSize: 16,
  
    h1: { fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", textTransform: "uppercase" },
    h2: { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", textTransform: "uppercase" },
    h3: { fontSize: "2rem", fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" },
    h5: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 },
    h6: { fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.5 },
    body1: { fontSize: "1rem", fontWeight: 500, lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.5 },
    subtitle1: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.5 },
    caption: { fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.4 },
    overline: { fontSize: "0.75rem", fontWeight: 800, lineHeight: 1.4, letterSpacing: "0.1em", textTransform: "uppercase" },
    button: { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" },
  };
  
  export default Typographies;