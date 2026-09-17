import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/images/blox');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Items list to download
const items = [
  // Mythical Fruits
  { id: 'kitsune', query: 'File:Kitsune Fruit.png' },
  { id: 'dragon', query: 'File:Dragon Fruit.png' },
  { id: 'leopard', query: 'File:Leopard Fruit.png' },
  { id: 'dough', query: 'File:Dough Fruit.png' },
  { id: 'trex', query: 'File:T-Rex Fruit.png' },
  { id: 'mammoth', query: 'File:Mammoth Fruit.png' },
  { id: 'spirit', query: 'File:Spirit Fruit.png' },
  { id: 'control', query: 'File:Control Fruit.png' },
  { id: 'venom', query: 'File:Venom Fruit.png' },
  { id: 'shadow', query: 'File:Shadow Fruit.png' },
  { id: 'gravity', query: 'File:Gravity Fruit.png' },

  // Legendary Fruits
  { id: 'buddha', query: 'File:Buddha Fruit.png' },
  { id: 'portal', query: 'File:Portal Fruit.png' },
  { id: 'rumble', query: 'File:Lightning Fruit.png' },
  { id: 'blizzard', query: 'File:Blizzard Fruit.png' },
  { id: 'sound', query: 'File:Sound Fruit.png' },
  { id: 'phoenix', query: 'File:Phoenix Fruit.png' },
  { id: 'pain', query: 'File:Pain Fruit.png' },
  { id: 'spider', query: 'File:Spider Fruit.png' },
  { id: 'love', query: 'File:Love Fruit.png' },
  { id: 'quake', query: 'File:Quake Fruit.png' },

  // Rare Fruits
  { id: 'magma', query: 'File:Magma Fruit.png' },
  { id: 'light', query: 'File:Light Fruit.png' },
  { id: 'ghost', query: 'File:Ghost Fruit.png' },
  { id: 'rubber', query: 'File:Rubber Fruit.png' },
  { id: 'barrier', query: 'File:Barrier Fruit.png' },

  // Uncommon & Common Fruits
  { id: 'dark', query: 'File:Dark Fruit.png' },
  { id: 'diamond', query: 'File:Diamond Fruit.png' },
  { id: 'sand', query: 'File:Sand Fruit.png' },
  { id: 'ice', query: 'File:Ice Fruit.png' },
  { id: 'flame', query: 'File:Flame Fruit.png' },
  { id: 'falcon', query: 'File:Falcon Fruit.png' },
  { id: 'smoke', query: 'File:Smoke Fruit.png' },
  { id: 'spin', query: 'File:Spin Fruit.png' },
  { id: 'rocket', query: 'File:Rocket Fruit.png' },
  { id: 'chop', query: 'File:Chop Fruit.png' },
  { id: 'spring', query: 'File:Spring Fruit.png' },
  { id: 'bomb', query: 'File:Bomb Fruit.png' },

  // Gamepasses & Badges
  { id: 'dark_blade', query: 'File:Dark Blade.png' },
  { id: 'gamepass_2x_money', query: 'File:2x_Money.png' },
  { id: 'gamepass_2x_mastery', query: 'File:2x_Mastery.png' },
  { id: 'gamepass_fast_boats', query: 'File:Fast_Boats.png' },
  { id: 'gamepass_notifier', query: 'File:Fruit_Notifier.png' },
  { id: 'gamepass_2x_drops', query: 'File:2x_Boss_Drops.png' },
  { id: 'gamepass_fruit_storage', query: 'File:+1_Fruit_Storage.png' },

  // Swords & Weapons
  { id: 'cursed_dual_katana', query: 'File:Cursed Dual Katana Icon.png' },
  { id: 'true_triple_katana', query: 'File:True Triple Katana.png' },
  { id: 'soul_guitar', query: 'File:Soul Guitar.png' },
  { id: 'hallow_scythe', query: 'File:Hallow Scythe.png' },
  { id: 'shark_anchor', query: 'File:Shark Anchor.png' },
  { id: 'fox_lamp', query: 'File:Fox Lamp.png' },
  { id: 'tushita', query: 'File:Tushita.png' },
  { id: 'yama', query: 'File:Yama.png' },
  { id: 'saber', query: 'File:Saber.png' },
  { id: 'rengoku', query: 'File:Rengoku.png' },

  // Fighting Styles & Accessories
  { id: 'godhuman', query: 'File:Godhuman.png' },
  { id: 'sanguine_art', query: 'File:Sanguine Art.png' },
  { id: 'dragon_talon', query: 'File:Dragon Talon.png' },
  { id: 'electric_claw', query: 'File:Electric Claw.png' },
  { id: 'death_step', query: 'File:Death Step.png' },
  { id: 'sharkman_karate', query: 'File:Sharkman Karate.png' },
  { id: 'mirror_fractal', query: 'File:Mirror Fractal.png' },
  { id: 'leviathan_heart', query: 'File:Leviathan Heart.png' },
  { id: 'valkyrie_helm', query: 'File:Valkyrie Helm.png' },
  { id: 'dark_coat', query: 'File:Dark Coat.png' }
];

async function getImageUrl(queryTitle) {
  // First try direct title
  const url1 = `https://blox-fruits.fandom.com/api.php?action=query&titles=${encodeURIComponent(queryTitle)}&prop=imageinfo&iiprop=url&format=json`;
  const res1 = await fetch(url1, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const data1 = await res1.json();
  const pages = Object.values(data1.query?.pages || {});
  if (pages[0]?.imageinfo?.[0]?.url) {
    return pages[0].imageinfo[0].url;
  }

  // Otherwise search
  const cleanTerm = queryTitle.replace('File:', '').replace('.png', '');
  const searchUrl = `https://blox-fruits.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTerm)}&srnamespace=6&srlimit=5&format=json`;
  const res2 = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const data2 = await res2.json();
  const searchHits = data2.query?.search || [];
  for (const hit of searchHits) {
    if (hit.title.endsWith('.png') || hit.title.endsWith('.webp') || hit.title.endsWith('.jpg')) {
      const infoUrl = `https://blox-fruits.fandom.com/api.php?action=query&titles=${encodeURIComponent(hit.title)}&prop=imageinfo&iiprop=url&format=json`;
      const res3 = await fetch(infoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data3 = await res3.json();
      const p = Object.values(data3.query?.pages || {})[0];
      if (p?.imageinfo?.[0]?.url) {
        return p.imageinfo[0].url;
      }
    }
  }
  return null;
}

async function downloadItem(item) {
  try {
    const imgUrl = await getImageUrl(item.query);
    if (!imgUrl) {
      console.log(`[FAILED SEARCH] ${item.id} (${item.query})`);
      return null;
    }

    const res = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      console.log(`[FAILED FETCH ${res.status}] ${item.id} -> ${imgUrl}`);
      return null;
    }

    const ext = imgUrl.includes('.webp') ? '.webp' : '.png';
    const filename = `${item.id}${ext}`;
    const filePath = path.join(outDir, filename);

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`[OK] ${item.id} (${buffer.length} bytes) -> /images/blox/${filename}`);
    return { id: item.id, path: `/images/blox/${filename}`, size: buffer.length };
  } catch (err) {
    console.error(`[ERR] ${item.id}:`, err.message);
    return null;
  }
}

async function main() {
  console.log(`Starting download of ${items.length} Blox Fruits items...`);
  const results = [];
  for (const item of items) {
    const res = await downloadItem(item);
    results.push({ item, res });
  }

  const downloaded = results.filter(r => r.res !== null);
  console.log(`Successfully downloaded: ${downloaded.length} / ${items.length}`);
  fs.writeFileSync('scripts_download_results.json', JSON.stringify(results, null, 2));
}

main();
