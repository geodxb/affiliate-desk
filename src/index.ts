export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
}

// Authorized IPs - Add your specific IPs here
const authorizedIPs = [
  '127.0.0.1',
  'localhost',
  // Private network ranges
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
  // Add your specific authorized IPs here
  // '203.0.113.1',
  // '198.51.100.1',
];

// Backend API URL - Replace with your actual backend URL
const backendURL = 'https://your-backend-api.com';

function getClientIP(request: Request): string {
  // Try different headers to get the real client IP
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
  
  return authorizedIPs.some(authorizedIP => {
    if (authorizedIP.endsWith('.')) {
      return ip.startsWith(authorizedIP);
    }
    return ip === authorizedIP;
  });
}

function injectAccessDeniedScript(html: string): string {
  const script = `
    <script>
      window.ipAccessDenied = true;
      console.warn('Access denied: IP not authorized');
    </script>
  `;
  
  return html.replace('</head>', `${script}</head>`);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const clientIP = getClientIP(request);
      
      console.log(`Request from IP: ${clientIP} to path: ${url.pathname}`);
      
      // Check IP authorization
      const isAuthorized = isAuthorizedIP(clientIP);
      
      // Handle API requests (proxy to backend)
      if (url.pathname.startsWith('/api/')) {
        if (!isAuthorized) {
          return new Response('ACCESS DENIED', { 
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
              'X-Robots-Tag': 'noindex, nofollow'
            }
          });
        }
        
        // Proxy API requests to backend
        const backendUrl = new URL(url.pathname + url.search, backendURL);
        const backendRequest = new Request(backendUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        
        return fetch(backendRequest);
      }
      
      // Serve static assets
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        
        if (assetResponse.status === 404) {
          // SPA fallback - serve index.html for client-side routing
          const indexRequest = new Request(new URL('/', request.url).toString(), request);
          const indexResponse = await env.ASSETS.fetch(indexRequest);
          
          if (!isAuthorized && indexResponse.ok) {
            // Inject access denied script for unauthorized IPs
            const html = await indexResponse.text();
            const modifiedHtml = injectAccessDeniedScript(html);
            
            return new Response(modifiedHtml, {
              status: 200,
              headers: {
                'Content-Type': 'text/html',
                'X-Robots-Tag': 'noindex, nofollow',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            });
          }
          
          return indexResponse;
        }
        
        // For unauthorized IPs accessing the main page, inject access denied script
        if (!isAuthorized && url.pathname === '/' && assetResponse.ok) {
          const html = await assetResponse.text();
          const modifiedHtml = injectAccessDeniedScript(html);
          
          return new Response(modifiedHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'X-Robots-Tag': 'noindex, nofollow',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
        
        return assetResponse;
      } catch (error) {
        console.error('Asset serving error:', error);
        
        // Fallback to index.html
        const indexRequest = new Request(new URL('/', request.url).toString(), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        
        if (!isAuthorized && indexResponse.ok) {
          const html = await indexResponse.text();
          const modifiedHtml = injectAccessDeniedScript(html);
          
          return new Response(modifiedHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'X-Robots-Tag': 'noindex, nofollow',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
        
        return indexResponse;
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Service Temporarily Unavailable', { 
        status: 503,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '60'
        }
      });
    }
  },
};