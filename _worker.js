// Cloudflare Pages _worker.js (edge handler for this site only)

const ROBOTS = [
  "User-agent: *",
  "Allow: /",
  "",
  "Sitemap: https://greenoceanconsultants.com/sitemap.xml",
  "",
  "User-agent: GPTBot","Disallow: /",
  "User-agent: Google-Extended","Disallow: /",
  "User-agent: CCBot","Disallow: /",
  "User-agent: anthropic-ai","Disallow: /",
].join("\n");

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // Serve robots.txt from the edge (no CF managed block)
    if (url.pathname === "/robots.txt") {
      return new Response(ROBOTS, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    // Everything else: serve the site normally
    return env.ASSETS.fetch(req);
  }
};
