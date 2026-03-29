import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scalar Scheduling",
    short_name: "Scalar",
    description: "A clean, minimal scheduling application.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb", // gray-50
    theme_color: "#111827", // gray-900
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
