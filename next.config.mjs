/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@anthropic-ai/sdk"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
