import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CoachMe",
    short_name: "CoachMe",
    description:
      "The performance graph for emerging athletes. Find a real coach. Track every PR.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#C5FF3D",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
