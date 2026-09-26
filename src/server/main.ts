import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './api';
import { fallbackProducts } from '../data/fallbackProducts';

dotenv.config();

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function injectProductMeta(html: string, product: any, baseUrl: string): string {
  const title = `${escapeHtml(product.name)} (฿${(product.price || 0).toLocaleString()}) | AngusShop Blox Fruits`;
  const cleanSummary = (product.shortDescription || product.description || '').replace(/\s+/g, ' ').trim();
  const summarySnippet = cleanSummary.length > 90 ? cleanSummary.slice(0, 87) + '...' : cleanSummary;
  const stockText = product.stock > 0 ? '✓ มีสินค้าพร้อมส่งทันที' : 'สินค้าหมดชั่วคราว';
  const rarityText = product.rarity ? `ระดับ: ${product.rarity}` : '';
  const categoryText = product.category ? `[${product.category}]` : '';
  const desc = escapeHtml(`ซื้อ ${product.name} ราคา ฿${(product.price || 0).toLocaleString()} ${categoryText} ${rarityText} ${stockText} ${summarySnippet ? `- ${summarySnippet}` : ''} - ร้าน AngusShop จัดส่งไว ปลอดภัย 100%`);

  let imageUrl = product.image || 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter';
  if (!imageUrl.startsWith('http')) {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    imageUrl = `${baseUrl}${cleanPath}`;
  }

  const productUrl = `${baseUrl}/?product=${encodeURIComponent(product.productId)}`;
  const escapedName = escapeHtml(product.name);

  let output = html;

  // Replace Title
  output = output.replace(/<title id="meta-title">.*?<\/title>/i, `<title id="meta-title">${title}</title>`);
  
  // Replace Meta Description & Canonical
  output = output.replace(/<meta id="meta-description" name="description" content=".*?" \/>/i, `<meta id="meta-description" name="description" content="${desc}" />`);
  output = output.replace(/<link rel="canonical" id="meta-canonical" href=".*?" \/>/i, `<link rel="canonical" id="meta-canonical" href="${productUrl}" />`);

  // Replace OpenGraph
  output = output.replace(/<meta id="og-type" property="og:type" content=".*?" \/>/i, `<meta id="og-type" property="og:type" content="product" />`);
  output = output.replace(/<meta id="og-title" property="og:title" content=".*?" \/>/i, `<meta id="og-title" property="og:title" content="${title}" />`);
  output = output.replace(/<meta id="og-description" property="og:description" content=".*?" \/>/i, `<meta id="og-description" property="og:description" content="${desc}" />`);
  output = output.replace(/<meta id="og-url" property="og:url" content=".*?" \/>/i, `<meta id="og-url" property="og:url" content="${productUrl}" />`);
  output = output.replace(/<meta id="og-image" property="og:image" content=".*?" \/>/i, `<meta id="og-image" property="og:image" content="${imageUrl}" />`);
  output = output.replace(/<meta id="og-image-secure" property="og:image:secure_url" content=".*?" \/>/i, `<meta id="og-image-secure" property="og:image:secure_url" content="${imageUrl}" />`);
  output = output.replace(/<meta id="og-image-alt" property="og:image:alt" content=".*?" \/>/i, `<meta id="og-image-alt" property="og:image:alt" content="${escapedName}" />`);

  // Replace Twitter
  output = output.replace(/<meta id="twitter-title" name="twitter:title" content=".*?" \/>/i, `<meta id="twitter-title" name="twitter:title" content="${title}" />`);
  output = output.replace(/<meta id="twitter-description" name="twitter:description" content=".*?" \/>/i, `<meta id="twitter-description" name="twitter:description" content="${desc}" />`);
  output = output.replace(/<meta id="twitter-image" name="twitter:image" content=".*?" \/>/i, `<meta id="twitter-image" name="twitter:image" content="${imageUrl}" />`);
  output = output.replace(/<meta id="twitter-image-alt" name="twitter:image:alt" content=".*?" \/>/i, `<meta id="twitter-image-alt" name="twitter:image:alt" content="${escapedName}" />`);

  // Inject E-commerce OpenGraph and Product Schema JSON-LD before </head>
  const extraTags = `
    <meta property="product:price:amount" content="${product.price || 0}" />
    <meta property="product:price:currency" content="THB" />
    <meta property="product:availability" content="${product.stock > 0 ? 'in stock' : 'out of stock'}" />
    <meta property="product:category" content="${escapeHtml(product.category || 'ผลปีศาจ')}" />
    <script id="product-jsonld" type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": ${JSON.stringify(product.name)},
      "image": [${JSON.stringify(imageUrl)}],
      "description": ${JSON.stringify(product.description || product.shortDescription || `${product.name} ในเกม Blox Fruits`)},
      "sku": ${JSON.stringify(product.productId)},
      "category": ${JSON.stringify(product.category || 'ผลปีศาจ')},
      "brand": {
        "@type": "Brand",
        "name": "Blox Fruits"
      },
      "offers": {
        "@type": "Offer",
        "url": ${JSON.stringify(productUrl)},
        "priceCurrency": "THB",
        "price": ${product.price || 0},
        "itemCondition": "https://schema.org/NewCondition",
        "availability": ${JSON.stringify(product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock')},
        "seller": {
          "@type": "Organization",
          "name": "Remix AngusShop"
        }
      }
    }
    </script>
  </head>`;

  output = output.replace(/<\/head>/i, extraTags);
  return output;
}

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount API router FIRST before Vite middlewares
  app.use('/api', apiRouter);

  // Serve static assets from public/images directly
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

  let vite: any = null;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Dynamic OpenGraph / Twitter Cards HTML interceptor for product detail views & social crawlers
  app.get(['/', '/product/:productId'], async (req, res, next) => {
    const prodParam = (req.query.product as string) || (req.params.productId as string);
    if (!prodParam) return next();

    const match = fallbackProducts.find(p => 
      p.productId.toLowerCase() === prodParam.toLowerCase() ||
      p.slug?.toLowerCase() === prodParam.toLowerCase()
    );

    if (!match) return next();

    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      const isProd = process.env.NODE_ENV === 'production';
      const indexPath = isProd 
        ? path.join(process.cwd(), 'dist', 'index.html') 
        : path.join(process.cwd(), 'index.html');

      let rawHtml = fs.readFileSync(indexPath, 'utf-8');
      let injectedHtml = injectProductMeta(rawHtml, match, baseUrl);

      if (!isProd && vite) {
        injectedHtml = await vite.transformIndexHtml(req.originalUrl, injectedHtml);
      }

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(injectedHtml);
      return;
    } catch (err) {
      console.error('Error serving product OpenGraph HTML:', err);
      return next();
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start server-side Keep-alive self-ping
  const EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://angusshopx.onrender.com';
  setInterval(() => {
    fetch(`${EXTERNAL_URL}/api/health`)
      .then(res => console.log(`[Keep-Alive] Pinged ${EXTERNAL_URL}: ${res.status}`))
      .catch(err => console.error(`[Keep-Alive] Ping failed:`, err.message));
  }, 10 * 60 * 1000); // 10 minutes

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AngusShop Server running on http://0.0.0.0:${PORT}`);
  });
}

// Auto-start if executed directly or bundled
startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
