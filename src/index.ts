export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
}

// Authorized IPs
const authorizedIPs = [
  '127.0.0.1',
  'localhost',
  '192.168.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
];

// Backend API URL
const backendURL = 'https://your-backend-api.com';

function getClientIP(request: Request): string {
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  const xRealIP = request.headers.get('X-Real-IP');

  if (cfConnectingIP) return cfConnectingIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIP) return xRealIP;

  return 'unknown';
}

function isAuthorizedIP(ip: string): boolean {
  if (ip === 'unknown') return false;

  return authorizedIPs.some(allowed => {
    if (allowed.endsWith('.')) return ip.startsWith(allowed);
    return ip === allowed;
  });
}

function injectAccessDeniedScript(html: string, ip: string): string {
  const script = `
<script>
window.ipAccessDenied = {
  status: true,
  ip: "${ip}",
  timestamp: "${new Date().toISOString()}"
};
</script>
`;

  return html.replace('</head>', `${script}</head>`);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const clientIP = getClientIP(request);
      const isAuthorized = isAuthorizedIP(clientIP);

      console.log(`IP: ${clientIP} → ${pathname}`);

      // API proxy
      if (pathname.startsWith('/api/')) {
        if (!isAuthorized) {
          return new Response('ACCESS DENIED', {
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }

        const backendUrl = new URL(pathname + url.search, backendURL);

        return fetch(
          new Request(backendUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body:
              request.method === 'GET' || request.method === 'HEAD'
                ? undefined
                : request.body,
          })
        );
      }

      // Serve static assets first
      const assetResponse = await env.ASSETS.fetch(request);

      // If real file exists → return it
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      // SPA fallback → ALWAYS index.html
      const indexRequest = new Request(
        new URL('/index.html', request.url),
        {
          method: 'GET',
        }
      );

      const indexResponse = await env.ASSETS.fetch(indexRequest);

      let html = await indexResponse.text();

      if (!isAuthorized) {
        html = injectAccessDeniedScript(html, clientIP);
      }

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      return new Response(
        error instanceof Error ? error.message : String(error),
        {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      );
    }
  },
};
