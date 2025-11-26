/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: "./empty-module.ts",
      },
    },
  },
  serverExternalPackages: ["knex"],
};

export default nextConfig;
