import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.carriercms.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.carriercms.com',
        port: '',
        pathname: '/**',
      }
    ]
    /* config options here */
  }
};

export default nextConfig;
