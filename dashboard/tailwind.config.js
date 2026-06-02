module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    // "./node_modules/flowbite/**/*.js",
  ],
  darkMode: "class",
  theme: {
    extend: {
      width: {
        sidebar: "320px",
        search: "400px",
      },
      rotate: {
        137: "137deg",
      },
      backgroundColor: {
        packed: "#0d0f12",
      },
      colors: {
        primary: "#D97706",
        case: {
          bg: "#0d0f12",
          surface: "#111318",
          card: "#161921",
          elevated: "#1c1f28",
          border: "#252830",
        },
      },
      fontFamily: {
        lexend: "'Lexend', sans-serif",
      },
    },
  },
  plugins: [],
};
