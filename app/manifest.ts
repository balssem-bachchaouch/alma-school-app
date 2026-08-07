import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALMA – Mon École",
    short_name: "ALMA",
    description: "L'app scolaire de tes rêves 🚀",
    start_url: "/",
    display: "standalone",
    background_color: "#c4b5fd",
    theme_color: "#c4b5fd",
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
