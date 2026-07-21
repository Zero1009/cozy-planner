import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the build lean; Drizzle + libSQL run only in server routes.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
