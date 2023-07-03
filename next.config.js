/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = {
  nextConfig,
  env: {
    NEXT_PUBLIC_RPC_HOST: process.env.NEXT_PUBLIC_RPC_HOST,
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
  }
}
