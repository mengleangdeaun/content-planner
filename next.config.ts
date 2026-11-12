import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Every response, including images and API JSON that cannot carry a robots meta tag, asks not to be indexed.
  headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" }],
      },
    ]
  },
}

export default nextConfig
