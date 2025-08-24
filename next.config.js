/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Roblox CDN domains - using wildcards for efficiency
      {
        protocol: 'https',
        hostname: '*.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.roblox.com',
      },
      // Specific Roblox domains for explicit control if needed
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't0.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't1.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't2.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't3.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't4.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't5.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't6.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't7.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c0.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c1.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c2.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c3.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c4.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c5.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c6.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'c7.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'www.roblox.com',
      },
      {
        protocol: 'https',
        hostname: 'api.roblox.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbnails.roblox.com',
      },
      {
        protocol: 'https',
        hostname: 'assetdelivery.roblox.com',
      },
    ],
  },
  reactStrictMode: true,
}

module.exports = nextConfig 