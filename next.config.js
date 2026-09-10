/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./products.db'],
    },
  },
};

module.exports = nextConfig;
