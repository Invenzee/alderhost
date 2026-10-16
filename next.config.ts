import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

const realRoot = fs.realpathSync(process.cwd());
if (path.resolve(process.cwd()) !== realRoot) {
  process.chdir(realRoot);
}

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: realRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
