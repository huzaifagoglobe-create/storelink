import type { Config } from "tailwindcss";

// Sage palette — the single source of truth for brand colours.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F6F5F2", // warm linen page background
        surface: "#FFFFFF", // cards, headers
        ink: "#221E1B", // rich near-black text
        muted: "#77716B", // warm secondary text
        line: "#E9E5DF", // warm hairline borders / dividers
        primary: { DEFAULT: "#8E2C5A", foreground: "#FFFFFF" }, // berry — brand + main buttons
        accent: { DEFAULT: "#F2A93B", foreground: "#5A3A0A" }, // marigold — highlights / tags
        whatsapp: { DEFAULT: "#25D366", foreground: "#063B22" }, // ONLY for WhatsApp actions
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: ['"Fraunces"', "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: { xl: "12px", "2xl": "16px" },
      maxWidth: { content: "480px" }, // mobile-first storefront column
    },
  },
  plugins: [],
};

export default config;
