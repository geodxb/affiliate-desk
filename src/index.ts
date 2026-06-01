export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
}

const backendURL = "https://your-backend-api.com";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API proxy (unchanged)
    if (url.pathname.startsWith("/api/")) {
      const target = new URL(url.pathname + url.search, backendURL);

      return fetch(target.toString(), {
        method: request.method,
        headers: request.headers,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : request.body,
      });
    }

    // Serve static assets
    const assetResponse = await env.ASSETS.fetch(request);

    // If file exists, return it
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // SPA fallback → index.html
    const indexResponse = await env.ASSETS.fetch(
      new Request(new URL("/index.html", request.url), {
        method: "GET",
      })
    );

    const html = await indexResponse.text();

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  },
};
