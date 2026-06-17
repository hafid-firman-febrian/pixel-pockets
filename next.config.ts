import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project. Without this, a stray
  // lockfile higher up the tree (e.g. ~/package-lock.json) makes Next infer the
  // wrong root, which breaks resolving `@import "tailwindcss"` and causes pages
  // to fail to compile ("This page couldn't load").
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
