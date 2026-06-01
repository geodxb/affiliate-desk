export interface Env {
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
}

// Authorized IPs
const authorizedIPs = [
  "127.0.0.1",
  "localhost",
  "192.168.",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
];

const backendURL = "https://your-backend-api.com";

function getClientIP(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP");
  const xff = request.headers.get("X-Forwarded-For");
  const xr = request.headers.get("X-Real-IP");

  if (cf) return cf;
  if (xff) return xff.split(",")[0].trim();
  if (xr) return xr;

  return "unknown";
}

function isAuthorizedIP(ip: string): boolean {
  if (ip === "unknown") return false;

  return authorizedIPs.some((a) => {
    if (a.endsWith(".")) return ip.startsWith(a);
    return ip === a;
  });
}

function injectScript(html: string, ip: string) {
  return html.replace(
    "</head>",
    `
<script>
window.ipAccessDenied = {
  status: true,
  ip: "${ip}",
  timestamp: "${new Date().toISOString()}"
};
</script>
</head>
`
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const ip = getClientIP(request);
      const authorized = isAuthorizedIP(ip);

      // API proxy
      if (pathname.startsWith("/api/")) {
        if (!authorized) {
          return new Response("ACCESS DENIED", { status: 403 });
        }

        const target = new URL(pathname + url.search, backendURL);

        return fetch(
          new Request(target.toString(), {
            method: request.method,
            headers: request.headers,
            body:
              request.method === "GET" || request.method === "HEAD"
                ? undefined
                : request.body,
          })
        );
      }

      // 🔥 FIX: safe asset handling (NO MORE undefined crash)
      const assets = env.ASSETS;

      if (!assets) {
        throw new Error("ASSETS binding missing in runtime");
      }

      const assetResponse = await assets.fetch(request);

      // If file exists → return it
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      // SPA fallback
      const indexResponse = await assets.fetch(
        new Request(new URL("/index.html", request.url), {
          method: "GET",
        })
      );

      let html = await indexResponse.text();

      if (!authorized) {
        html = injectScript(html, ip);
      }

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      return new Response(
        err instanceof Error ? err.message : String(err),
        {
          status: 500,
        }
      );
    }
  },
};
