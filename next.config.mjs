// Production Security Build Guard: Ensure role simulator cannot be enabled in production
if (process.env.NODE_ENV === 'production' && (process.env.ENABLE_ROLE_SIMULATOR === 'true' || process.env.NEXT_PUBLIC_ENABLE_ROLE_SIMULATOR === 'true')) {
  throw new Error(
    'FATAL SECURITY VIOLATION: ENABLE_ROLE_SIMULATOR is set to true in production. Simulation of user states is strictly prohibited in production builds.'
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'localhost:3000',
    'localhost:3001',
    '127.0.0.1:3000',
    '127.0.0.1:3001',
    '192.168.100.66:3000',
    '192.168.100.66:3001',
    '192.168.100.66',
  ],
}

export default nextConfig
