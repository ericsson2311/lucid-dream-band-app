export default function manifest() {
  return {
    name: "Lucid Dream Bandverwaltung",
    short_name: "Lucid Dream",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-black.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
