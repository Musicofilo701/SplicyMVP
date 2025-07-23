<<<<<<< HEAD

=======
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');
    return config;
  },
<<<<<<< HEAD
  // Add allowedDevOrigins configuration here
  allowedDevOrigins: [
    'https://393d4856-5032-48ce-8435-fbc06b85719e-00-10c9r861vv0uv.riker.replit.dev',
    'http://0.0.0.0:3001',
    'http://localhost:3001'
  ],
=======
>>>>>>> 461cb27a17fa336e417741d27f6a50c6f626d00e
};

export default nextConfig;
