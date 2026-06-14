/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project (avoids picking up a stray
  // lockfile elsewhere on the machine). import.meta.dirname is portable
  // across OSes, so it works the same locally and on Vercel.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
