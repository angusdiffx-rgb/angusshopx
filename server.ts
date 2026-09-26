import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bundledServer = path.join(process.cwd(), 'dist', 'server.cjs');

// In production (or anytime bundled server exists and we are not in `npm run dev`)
const isDev = process.env.npm_lifecycle_event === 'dev' || process.env.NODE_ENV === 'development-vite';

if (fs.existsSync(bundledServer) && !isDev) {
  require(bundledServer);
} else {
  // In development, tsx will compile and run the TypeScript entry point
  await import('./src/server/main.ts');
}
