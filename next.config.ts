import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the build lean; Drizzle + libSQL run only in server routes.
  serverExternalPackages: ["@libsql/client", "web-push"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
