import type { NextConfig } from "next";

/* The site is the static revamp in /public; Next stays for the API (the gallery's memory) and
   the labs. Clean URLs map onto the pages, and anything unknown lands on the revamp's own 404. */
const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/about", destination: "/about.html" },
        { source: "/art-gallery", destination: "/art-gallery.html" },
        { source: "/work/:slug((?!.*\\.html$)[^/]+)", destination: "/work/:slug.html" },
      ],
      afterFiles: [],
      fallback: [{ source: "/:path*", destination: "/soon.html" }],
    };
  },
};

export default nextConfig;
