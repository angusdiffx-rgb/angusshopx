import fs from 'fs';

const content = fs.readFileSync('src/data/bloxPresets.ts', 'utf8');
const urls = [...content.matchAll(/url:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
const uniqueUrls = [...new Set(urls)];

console.log('Total preset URLs:', uniqueUrls.length);

async function main() {
  const broken = [];
  const valid = [];
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) {
        broken.push({ url, status: res.status });
      } else {
        valid.push(url);
      }
    } catch (e) {
      broken.push({ url, status: e.message });
    }
  }

  console.log(`Valid: ${valid.length}, Broken: ${broken.length}`);
  console.log('Broken:');
  broken.forEach(b => console.log(`${b.status} : ${b.url}`));
}

main();
