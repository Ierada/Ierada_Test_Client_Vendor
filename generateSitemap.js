import fs from "fs";
import path from "path";

// Function to generate vendor sitemap
async function generateVendorSitemap() {
  const baseUrl = "https://vendor.ierada.com";
  const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
  const date = new Date().toISOString().split("T")[0];

  // ✅ Static vendor panel routes (from your VendorRoutes.jsx)
  const staticRoutes = [
    { url: "/login", changefreq: "monthly", priority: "0.5" },
    { url: "/dashboard", changefreq: "daily", priority: "1.0" },
    { url: "/product", changefreq: "daily", priority: "0.9" },
    { url: "/product/add", changefreq: "monthly", priority: "0.8" },
    { url: "/bulk-upload", changefreq: "monthly", priority: "0.7" },
    { url: "/settings", changefreq: "monthly", priority: "0.6" },
    { url: "/orders", changefreq: "daily", priority: "0.9" },
    { url: "/invoice", changefreq: "monthly", priority: "0.8" },
    { url: "/invoice/create", changefreq: "monthly", priority: "0.7" },
    { url: "/coupons", changefreq: "monthly", priority: "0.7" },
    { url: "/report", changefreq: "monthly", priority: "0.6" },
    { url: "/chat", changefreq: "daily", priority: "0.7" },
    { url: "/influencer", changefreq: "monthly", priority: "0.6" },
    { url: "/profile", changefreq: "monthly", priority: "0.6" },
    { url: "/trackorders", changefreq: "daily", priority: "0.7" },
    {
      url: "/influencer/campaign/create",
      changefreq: "monthly",
      priority: "0.6",
    },
    { url: "/subcription", changefreq: "monthly", priority: "0.6" },
    { url: "/review", changefreq: "monthly", priority: "0.6" },
    { url: "/support", changefreq: "monthly", priority: "0.5" },
    { url: "/training", changefreq: "monthly", priority: "0.5" },
    { url: "/notifications", changefreq: "daily", priority: "0.7" },
    { url: "/logout", changefreq: "monthly", priority: "0.4" },
    { url: "/ads/history", changefreq: "monthly", priority: "0.6" },
    { url: "/ads/add", changefreq: "monthly", priority: "0.6" },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(sitemapPath, sitemap, "utf8");
  console.log("✅ Vendor sitemap generated at:", sitemapPath);
}

// Run
try {
  await generateVendorSitemap();
} catch (err) {
  console.error("❌ Vendor sitemap generation failed:", err);
  process.exit(1);
}
