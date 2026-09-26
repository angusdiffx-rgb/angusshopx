import { useEffect } from 'react';
import type { Product } from '../types';

/**
 * Default Store SEO configuration for Remix AngusShop
 */
export const DEFAULT_SEO = {
  title: 'Remix AngusShop | ร้านขายผลปีศาจ Blox Fruits',
  description: 'ร้านขายผลปีศาจ Blox Fruits และสินค้า/บริการ Roblox ระบบเติมเงิน PromptPay อัตโนมัติ',
  siteName: 'Remix AngusShop',
  image: 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter',
  url: 'https://angusshopx.onrender.com',
};

/**
 * Format dynamic meta tag content for a given product
 */
export function getProductMetadata(product: Product, hostUrl?: string) {
  const origin = hostUrl || (typeof window !== 'undefined' ? window.location.origin : DEFAULT_SEO.url);
  
  // Format title
  const title = `${product.name} (฿${(product.price || 0).toLocaleString()}) | AngusShop Blox Fruits`;
  
  // Format description
  const stockText = product.stock > 0 ? '✓ มีสินค้าพร้อมส่งทันที' : 'สินค้าหมดชั่วคราว';
  const rarityText = product.rarity ? `ระดับ: ${product.rarity}` : '';
  const categoryText = product.category ? `[${product.category}]` : '';
  const cleanSummary = (product.shortDescription || product.description || '').replace(/\s+/g, ' ').trim();
  const summarySnippet = cleanSummary.length > 90 ? cleanSummary.slice(0, 87) + '...' : cleanSummary;
  
  const description = `ซื้อ ${product.name} ราคา ฿${(product.price || 0).toLocaleString()} ${categoryText} ${rarityText} ${stockText} ${summarySnippet ? `- ${summarySnippet}` : ''} - ร้าน AngusShop จัดส่งไว ปลอดภัย 100%`;
  
  // Format absolute image URL
  let imageUrl = product.image || DEFAULT_SEO.image;
  if (!imageUrl.startsWith('http')) {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    imageUrl = `${origin}${cleanPath}`;
  }

  // Canonical product URL
  const productUrl = `${origin}/?product=${encodeURIComponent(product.productId)}`;

  return {
    title,
    description,
    imageUrl,
    productUrl,
    origin,
    category: product.category,
    price: product.price,
    stock: product.stock,
    isAvailable: product.stock > 0,
    rarity: product.rarity,
    sku: product.productId,
  };
}

/**
 * Safely update or create a <meta> element in document.head
 */
function setMeta(propertyOrName: 'property' | 'name', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${propertyOrName}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(propertyOrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Safely remove a <meta> element by selector
 */
function removeMeta(propertyOrName: 'property' | 'name', key: string) {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(`meta[${propertyOrName}="${key}"]`);
  if (el) el.remove();
}

/**
 * Update or create canonical URL link in document.head
 */
function setCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Inject or update Schema.org Product JSON-LD structured data
 */
function setProductJsonLd(product: Product | null, productUrl: string, imageUrl: string) {
  if (typeof document === 'undefined') return;
  const SCRIPT_ID = 'product-jsonld';
  const existing = document.getElementById(SCRIPT_ID);

  if (!product) {
    if (existing) existing.remove();
    return;
  }

  const jsonLdData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [imageUrl],
    description: product.description || product.shortDescription || `${product.name} ในเกม Blox Fruits`,
    sku: product.productId,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Blox Fruits',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'THB',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Remix AngusShop',
      },
    },
  };

  const script = (existing as HTMLScriptElement) || document.createElement('script');
  script.id = SCRIPT_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLdData, null, 2);

  if (!existing) {
    document.head.appendChild(script);
  }
}

/**
 * Dynamically updates all head tags, OpenGraph cards, Twitter cards, and JSON-LD
 * to match the selected product.
 */
export function updateProductMetaTags(product: Product | null, hostUrl?: string) {
  if (typeof document === 'undefined') return;

  if (!product) {
    resetToDefaultMetaTags();
    return;
  }

  const meta = getProductMetadata(product, hostUrl);

  // 1. Browser Title
  document.title = meta.title;

  // 2. Primary Meta Description & Canonical
  setMeta('name', 'description', meta.description);
  setCanonical(meta.productUrl);

  // 3. OpenGraph Social Card Tags
  setMeta('property', 'og:site_name', DEFAULT_SEO.siteName);
  setMeta('property', 'og:type', 'product');
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', meta.productUrl);
  setMeta('property', 'og:image', meta.imageUrl);
  setMeta('property', 'og:image:secure_url', meta.imageUrl);
  setMeta('property', 'og:image:alt', product.name);
  setMeta('property', 'og:locale', 'th_TH');

  // OpenGraph E-commerce specific tags
  setMeta('property', 'product:price:amount', String(meta.price));
  setMeta('property', 'product:price:currency', 'THB');
  setMeta('property', 'product:availability', meta.isAvailable ? 'in stock' : 'out of stock');
  setMeta('property', 'product:condition', 'new');
  setMeta('property', 'product:retailer_item_id', meta.sku);
  if (meta.category) {
    setMeta('property', 'product:category', meta.category);
  }

  // 4. Twitter / X Card Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', meta.imageUrl);
  setMeta('name', 'twitter:image:alt', product.name);

  // 5. Schema.org JSON-LD structured data
  setProductJsonLd(product, meta.productUrl, meta.imageUrl);
}

/**
 * Resets document title, meta tags, and OpenGraph/Twitter cards back to the default store state.
 */
export function resetToDefaultMetaTags() {
  if (typeof document === 'undefined') return;

  const origin = window.location.origin || DEFAULT_SEO.url;

  document.title = DEFAULT_SEO.title;
  setMeta('name', 'description', DEFAULT_SEO.description);
  setCanonical(origin);

  // OpenGraph
  setMeta('property', 'og:site_name', DEFAULT_SEO.siteName);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:title', DEFAULT_SEO.title);
  setMeta('property', 'og:description', DEFAULT_SEO.description);
  setMeta('property', 'og:url', origin);
  setMeta('property', 'og:image', DEFAULT_SEO.image);
  setMeta('property', 'og:image:secure_url', DEFAULT_SEO.image);
  setMeta('property', 'og:image:alt', DEFAULT_SEO.siteName);
  setMeta('property', 'og:locale', 'th_TH');

  // Clean up product-specific OpenGraph tags
  removeMeta('property', 'product:price:amount');
  removeMeta('property', 'product:price:currency');
  removeMeta('property', 'product:availability');
  removeMeta('property', 'product:condition');
  removeMeta('property', 'product:retailer_item_id');
  removeMeta('property', 'product:category');

  // Twitter
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', DEFAULT_SEO.title);
  setMeta('name', 'twitter:description', DEFAULT_SEO.description);
  setMeta('name', 'twitter:image', DEFAULT_SEO.image);
  setMeta('name', 'twitter:image:alt', DEFAULT_SEO.siteName);

  // Remove product JSON-LD
  setProductJsonLd(null, '', '');
}

/**
 * React hook to automatically generate and apply dynamic meta tags based on the
 * current product detail view, and restore default store meta tags on unmount.
 */
export function useProductSEO(product: Product | null | undefined) {
  useEffect(() => {
    if (!product) {
      resetToDefaultMetaTags();
      return;
    }

    updateProductMetaTags(product);

    return () => {
      resetToDefaultMetaTags();
    };
  }, [product]);
}
