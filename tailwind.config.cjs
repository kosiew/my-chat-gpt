/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mirage: {
          50: "#f6f6f7",
          100: "#e1e3e6",
          200: "#c3c7cc",
          300: "#9da2ab",
          400: "#787d89",
          500: "#5e636e",
          600: "#4a4d57",
          700: "#3e4047",
          800: "#34353b",
          900: "#202124",
        },
      },
      keyframes: {
        blink: {
          "0%": { opacity: 0.3 },
          "50%": { opacity: 1 },
          "100%": { opacity: 0.3 },
        },
        "blink-scale": {
          "0%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
          "100%": { opacity: "0.3", transform: "scale(1)" },
        },
      },
      animation: {
        blink: "blink 800ms ease-in-out infinite",
      },
      transitionDelay: {
        200: "200ms",
        400: "400ms",
      },
    },
  },
  variants: {
    extend: {
      animation: [
        "responsive",
        "motion-safe",
        "motion-reduce",
        "hover",
        "focus",
        "disabled",
      ],
    },
  },
  plugins: [],
};
