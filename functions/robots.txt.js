// /functions/robots.txt.js  (Cloudflare Pages Functions - basic mode)
// Serves a clean robots.txt from the edge (no managed block).

const BODY = [
  "User-agent: *",
  "Allow: /",
  "",
  "Sitemap: https://greenoceanconsultants.com/sitemap.xml",
  "",
  "User-agent: GPTBot", "Disallow: /",
  "User-agent: Google-Extended", "Disallow: /",
  "User-agent: CCBot", "Disallow: /",
  "User-agent: anthropic-ai", "Disallow: /",
].join("\n");

export async function onRequest() {
  return new Response(BODY, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
