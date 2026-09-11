import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/internal/studio/projects/*/final-render": [
      "./node_modules/ffmpeg-static/ffmpeg",
      "./node_modules/ffmpeg-static/**/*",
      "./node_modules/next/dist/compiled/@vercel/og/**/*",
    ],
  },
};

export default nextConfig;
