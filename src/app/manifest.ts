import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KoachMe",
    short_name: "KoachMe",
    description:
      "The performance graph for emerging athletes. Find a real coach. Track every PR.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#C5FF3D",
    orientation: "portrait",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
