/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind to scan these files for class names
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // MilkWise brand colours — mirrors the design tokens in README.md
      colors: {
        bg:           "#F5F2EB",
        surface:      "#FFFFFF",
        surface2:     "#F9F7F2",
        green:        "#1B5E3B",
        "green-mid":  "#2D7A52",
        "green-light":"#EBF5EE",
        amber:        "#E07B39",
        "amber-light":"#FDF0E6",
        text:         "#1A1A1A",
        muted:        "#6B7280",
        border:       "#E0D9CC",
      },
    },
  },
  plugins: [],
};
