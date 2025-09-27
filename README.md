# Interactive Brokers Investor Portal

A modern, secure investor portal built with React, TypeScript, and Firebase.

## Features

- 🔐 Secure authentication with Firebase Auth
- 📊 Real-time portfolio tracking
- 💰 Withdrawal management
- 💬 Messaging system
- 🎫 Support ticket system
- 📱 Responsive design
- 🚀 Fast performance with Vite

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages
- **UI Components**: Framer Motion, Lucide React

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your Firebase configuration

5. Start development server:
   ```bash
   npm run dev
   ```

## Deployment

### Cloudflare Workers

This project is configured for deployment on Cloudflare using Cloudflare Workers and Wrangler.

#### Features:
- **IP Whitelisting**: Server-side IP filtering for enhanced security
- **API Proxying**: Proxy API requests through the Worker
- **SPA Routing**: Proper handling of client-side routing
- **Edge Performance**: Runs on Cloudflare's global edge network

#### Deployment Steps:

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Configure IP Whitelist**:
   Edit `src/index.ts` and add your authorized IPs to the `authorizedIPs` array.

4. **Deploy**:
   ```bash
   npm run deploy
   ```

#### Development:

**Local development with Worker:**
```bash
npm run dev:worker
```

**View Worker logs:**
```bash
npm run tail
```

#### Configuration:

- **Worker Script**: `src/index.ts` - Contains IP filtering, API proxying, and asset serving logic
- **Build Config**: `wrangler.toml` - Cloudflare Worker configuration
- **IP Whitelist**: Edit the `authorizedIPs` array in `src/index.ts`
- **Backend URL**: Update `backendURL` in `src/index.ts` for API proxying

#### Security Features:

- **IP-based Access Control**: Only authorized IPs can access the application
- **Access Denied Handling**: Unauthorized IPs see a custom access denied message
- **API Protection**: API routes are protected by the same IP filtering
- **No-index Headers**: Unauthorized access gets no-index headers for SEO protection

### Alternative: Cloudflare Pages (Legacy)

If you prefer to use Cloudflare Pages instead of Workers:

1. Build and deploy:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=interactive-brokers-portal
   ```

## Environment Variables

Set the following environment variables in Cloudflare dashboard (Workers > Settings > Variables):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Worker Configuration

- **Entry Point**: `src/index.ts`
- **Assets Directory**: `dist`
- **Compatibility Date**: `2025-01-08`
- **Build Command**: `npm run build`

## Security Features

- **IP Whitelisting**: Server-side IP filtering
- **Content Security Policy**: Security headers
- **XSS Protection**: Frame options and content type protection
- **Secure Authentication**: Firebase Auth integration
- **Role-based Access**: Investor-only portal access
- **Access Denied Handling**: Custom UI for unauthorized access

## Performance

- Code splitting with manual chunks
- Asset optimization
- Lazy loading
- Efficient caching strategies

## License

Private - All rights reserved