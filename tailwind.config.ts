import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8FC",
        ink: "#212121",
        muted: "#6F6F6F",
        line: "#E6E6F0",
        brand: "#2461FB",
        cyan: "#14B8C5",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(18, 31, 67, 0.08)",
        panel: "0 1px 2px rgba(18, 31, 67, 0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
