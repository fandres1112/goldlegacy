import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/iniciar-sesion", "/registro", "/checkout", "/carrito"] }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
