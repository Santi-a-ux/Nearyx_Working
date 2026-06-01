import type { NextConfig } from "next";

const mapboxToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
  process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
  "";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: mapboxToken,
  },
};

export default nextConfig;
