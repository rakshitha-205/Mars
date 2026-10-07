/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com'],
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const backendTarget =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (isDev ? 'http://localhost:5000' : '');

    if (!backendTarget) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendTarget.replace(/\/$/, '')}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendTarget.replace(/\/$/, '')}/socket.io/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
