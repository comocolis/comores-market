import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#22c55e", // Vert principal (logo, boutons)
          dark: "#16a34a",    // Vert au survol
        },
      },
      // On ajoute la taille 125 (500px) pour que la classe max-w-125 fonctionne partout
      spacing: {
        '125': '500px',
        '17.5': '70px', // Pour les catégories (min-w-17.5)
        '27': '108px',
        '44.5': '178px',
        '75': '300px',  // Pour la hauteur min (min-h-75)
        '25': '100px',  // Pour le sticky top (top-25)
      },
      zIndex: {
        '100': '100',
        '9999': '9999',
      },
      maxWidth: {
        '125': '500px',
      }
    },
  },
  plugins: [],
};
export default config;