// import type { NextConfig } from "next";

const repo = "needlepoint-chart";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: { unoptimized: true },
  // basePath: "/needlepoint-chart",
  // assetPrefix: "/needlepoint-chart/",
  // env: {
  //   NEXT_PUBLIC_BASE_PATH: "/needlepoint-chart",
  // },
};

export default nextConfig;
