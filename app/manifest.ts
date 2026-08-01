import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALMA – Mon École",
    short_name: "ALMA",
    description: "L'app scolaire de tes rêves 🚀",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0520",
    theme_color: "#8b5cf6",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
