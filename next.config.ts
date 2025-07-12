import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
