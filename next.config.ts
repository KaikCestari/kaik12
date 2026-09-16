import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/login", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }] },
      { source: "/api/auth/login", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }] },
      { source: "/api/auth/me", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }] },
    ];
  },
  experimental: {
    // Avoid the CLI subprocess in restricted environments while preserving
    // Next.js' full production type checking through the TypeScript API.
    useTypeScriptCli: false,
    // Worker processes cannot return their output in this execution sandbox.
    // Threads keep static generation isolated without relying on subprocesses.
    workerThreads: true,
  },
};

export default nextConfig;
