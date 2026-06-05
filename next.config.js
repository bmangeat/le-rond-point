/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile pictures
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com", // Vercel Blob (photos de profil)
      },
    ],
  },
};

module.exports = nextConfig;
