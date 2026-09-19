import { HomeConfig } from '../types';

export interface BloxPreset {
  name: string;
  th: string;
  category: 'ผลปีศาจ' | 'Gamepass' | 'ไอเทม' | 'บริการ' | 'สกินผล' | 'อื่นๆ';
  rarity?: 'Mythical' | 'Legendary' | 'Rare' | 'Uncommon' | 'Common';
  subType?: 'Fruit' | 'Gamepass' | 'Sword' | 'Gun' | 'FightingStyle' | 'Material' | 'Accessory';
  url: string;
}

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  siteLogo: 'https://tr.rbxcdn.com/180DAY-774ec14539b264f85fdb6e8a34dfa344/512/512/Image/Png/noFilter',
  heroBadgeText: 'ROBLOX VERIFIED',
  heroStatusText: 'ร้านผลปีศาจ Blox Fruits อัตโนมัติ 24 ชม.',
  heroTitle: 'ANGUS SHOP',
  heroSubtitle: 'ศูนย์รวมผลปีศาจ Blox Fruits ถาวร, Gamepass และบริการฟาร์ม Roblox ส่งมอบทันที',
  heroButtonText: 'เลือกซื้อสินค้าเลย',
  stat1Label: 'ลูกค้าไว้วางใจ',
  stat2Label: 'สินค้าคุณภาพ',
  stat3Label: 'รับประกัน',
  stat4Label: 'บริการ 24 ชม.',
  categoriesTitle: 'หมวดหมู่สินค้า',
  categoriesSubtitle: 'เลือกช้อปสินค้า Blox Fruits ตามประเภทที่ท่านต้องการ',
  categoryCards: [
    { name: 'ผลปีศาจ', desc: 'คิตสึเนะ มังกร โมจิ ถาวร & กล่องผล', iconType: 'icon', iconName: 'Flame', colorClass: 'from-amber-500/25 to-orange-500/10' },
    { name: 'Gamepass', desc: 'ดาบโยรุ คูณเงิน คูณชำนาญ เรือเร็ว', iconType: 'icon', iconName: 'Zap', colorClass: 'from-purple-500/25 to-indigo-500/10' },
    { name: 'ไอเทม', desc: 'ดาบคู่ CDK กีตาร์วิญญาณ รหัสเทพ', iconType: 'icon', iconName: 'Sparkles', colorClass: 'from-emerald-500/25 to-teal-500/10' },
    { name: 'บริการ', desc: 'ดันดอว์ อเวค V4 ฟาร์มเวลทันใจ', iconType: 'icon', iconName: 'ShieldCheck', colorClass: 'from-rose-500/25 to-pink-500/10' },
  ],
  // 1. แถบผลปีศาจยอดนิยมประจำสัปดาห์ (Weekly Trending Strip)
  trendingTitle: 'ผลปีศาจยอดนิยมประจำสัปดาห์ (ยอดสั่งซื้อสูงสุด)',
  trendingBadge: 'VIP Server พร้อมเทรด',
  trendingItems: [
    {
      id: 'trend-kitsune',
      name: 'Kitsune',
      th: 'คิตสึเนะ',
      price: '฿299',
      img: '/images/blox/kitsune.png',
      rarity: 'Mythical'
    },
    {
      id: 'trend-dragon',
      name: 'Dragon',
      th: 'มังกร',
      price: '฿249',
      img: '/images/blox/dragon.png',
      rarity: 'Mythical'
    },
    {
      id: 'trend-leopard',
      name: 'Leopard',
      th: 'เสือ',
      price: '฿219',
      img: '/images/blox/leopard.png',
      rarity: 'Mythical'
    },
    {
      id: 'trend-dough',
      name: 'Dough',
      th: 'โมจิ',
      price: '฿189',
      img: '/images/blox/dough.png',
      rarity: 'Mythical'
    },
    {
      id: 'trend-trex',
      name: 'T-Rex',
      th: 'ทีเร็กซ์',
      price: '฿179',
      img: '/images/blox/trex.png',
      rarity: 'Mythical'
    },
    {
      id: 'trend-darkblade',
      name: 'Dark Blade',
      th: 'ดาบโยรุ',
      price: '฿159',
      img: '/images/blox/dark_blade.png',
      rarity: 'Gamepass'
    },
  ],

  // 2. แบนเนอร์ไฮไลท์โปรโมชั่นส่งมอบไว (Fast & Secure Hero Banner)
  promoBadge: 'FAST & SECURE ROBLOX DELIVERY',
  promoTitle: 'รับผลปีศาจและ Gamepass แท้ 100% ส่งมอบรวดเร็วใน 3 นาที',
  promoDescription: 'ระบบส่งมอบอัตโนมัติ 24 ชั่วโมง เทรดรับไอเทมได้ทันทีในเซิร์ฟเวอร์ VIP ของ AngusShop การันตีปลอดภัย ไม่มีประวัติแบน รองรับชำระผ่าน PromptPay สแกนจ่ายตรวจสอบสลิปอัตโนมัติ',
  promoButtonText: 'ช้อปผลปีศาจตอนนี้เลย',
  promoSecondaryButtonText: 'ดูเฉพาะผลปีศาจ',
  promoCard1: {
    name: 'ผลคิตสึเนะ',
    tag: 'Mythical • ฿299',
    img: '/images/blox/kitsune.png',
    keyword: 'คิตสึเนะ'
  },
  promoCard2: {
    name: 'ผลมังกร',
    tag: 'Mythical • ฿249',
    img: '/images/blox/dragon.png',
    keyword: 'มังกร'
  },
  promoFooterText: 'มีผลสต็อกพร้อมส่งในเซิร์ฟ VIP',
  promoFooterTag: '100% แท้'
};

// ฐานข้อมูลผลไม้ ไอเทม Gamepass ดาบ และหมัด ทั้งหมดในเกม Blox Fruits
export const BLOX_FRUITS_PRESETS: BloxPreset[] = [
  // ===================== MYTHICAL FRUITS =====================
  {
    name: 'Kitsune Fruit',
    th: 'ผลคิตสึเนะ (Kitsune)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/kitsune.png',
  },
  {
    name: 'Dragon Fruit',
    th: 'ผลมังกร (Dragon)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/dragon.png',
  },
  {
    name: 'Leopard Fruit',
    th: 'ผลเสือดาว (Leopard)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/leopard.png',
  },
  {
    name: 'Dough Fruit',
    th: 'ผลโมจิ (Dough)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/dough.png',
  },
  {
    name: 'T-Rex Fruit',
    th: 'ผลทีเร็กซ์ (T-Rex)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/trex.png',
  },
  {
    name: 'Mammoth Fruit',
    th: 'ผลช้างแมมมอธ (Mammoth)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/mammoth.png',
  },
  {
    name: 'Spirit Fruit',
    th: 'ผลวิญญาณ (Spirit)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/spirit.png',
  },
  {
    name: 'Control Fruit',
    th: 'ผลคอนโทรล (Control)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/control.png',
  },
  {
    name: 'Venom Fruit',
    th: 'ผลพิษ (Venom)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/venom.png',
  },
  {
    name: 'Shadow Fruit',
    th: 'ผลเงา (Shadow)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/shadow.png',
  },
  {
    name: 'Gravity Fruit',
    th: 'ผลแรงโน้มถ่วง (Gravity)',
    category: 'ผลปีศาจ',
    rarity: 'Mythical',
    subType: 'Fruit',
    url: '/images/blox/gravity.png',
  },

  // ===================== LEGENDARY FRUITS =====================
  {
    name: 'Blizzard Fruit',
    th: 'ผลพายุหิมะ (Blizzard)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/blizzard.png',
  },
  {
    name: 'Portal Fruit',
    th: 'ผลประตูมิติ (Portal)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/portal.png',
  },
  {
    name: 'Rumble Fruit',
    th: 'ผลสายฟ้า (Rumble)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/rumble.png',
  },
  {
    name: 'Buddha Fruit',
    th: 'ผลพระ (Buddha)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/buddha.png',
  },
  {
    name: 'Phoenix Fruit',
    th: 'ผลฟีนิกซ์ (Phoenix)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/phoenix.png',
  },
  {
    name: 'Sound Fruit',
    th: 'ผลเสียง (Sound)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/sound.png',
  },
  {
    name: 'Spider Fruit',
    th: 'ผลใยแมงมุม (Spider)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/spider.png',
  },
  {
    name: 'Love Fruit',
    th: 'ผลความรัก (Love)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/love.png',
  },
  {
    name: 'Pain Fruit',
    th: 'ผลเพน/อุ้งเท้าหมี (Pain)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/pain.png',
  },
  {
    name: 'Quake Fruit',
    th: 'ผลสั่นสะเทือน (Quake)',
    category: 'ผลปีศาจ',
    rarity: 'Legendary',
    subType: 'Fruit',
    url: '/images/blox/quake.png',
  },

  // ===================== RARE FRUITS =====================
  {
    name: 'Magma Fruit',
    th: 'ผลแมกม่า (Magma)',
    category: 'ผลปีศาจ',
    rarity: 'Rare',
    subType: 'Fruit',
    url: '/images/blox/magma.png',
  },
  {
    name: 'Ghost Fruit',
    th: 'ผลผี (Ghost)',
    category: 'ผลปีศาจ',
    rarity: 'Rare',
    subType: 'Fruit',
    url: '/images/blox/ghost.png',
  },
  {
    name: 'Barrier Fruit',
    th: 'ผลบาเรีย (Barrier)',
    category: 'ผลปีศาจ',
    rarity: 'Rare',
    subType: 'Fruit',
    url: '/images/blox/barrier.png',
  },
  {
    name: 'Rubber Fruit',
    th: 'ผลยาง (Rubber)',
    category: 'ผลปีศาจ',
    rarity: 'Rare',
    subType: 'Fruit',
    url: '/images/blox/rubber.png',
  },
  {
    name: 'Light Fruit',
    th: 'ผลแสง (Light)',
    category: 'ผลปีศาจ',
    rarity: 'Rare',
    subType: 'Fruit',
    url: '/images/blox/light.png',
  },
  {
    name: 'Diamond Fruit',
    th: 'ผลเพชร (Diamond)',
    category: 'ผลปีศาจ',
    rarity: 'Rare',
    subType: 'Fruit',
    url: '/images/blox/diamond.png',
  },

  // ===================== UNCOMMON FRUITS =====================
  {
    name: 'Dark Fruit',
    th: 'ผลความมืด (Dark)',
    category: 'ผลปีศาจ',
    rarity: 'Uncommon',
    subType: 'Fruit',
    url: '/images/blox/dark.png',
  },
  {
    name: 'Sand Fruit',
    th: 'ผลทราย (Sand)',
    category: 'ผลปีศาจ',
    rarity: 'Uncommon',
    subType: 'Fruit',
    url: '/images/blox/sand.png',
  },
  {
    name: 'Ice Fruit',
    th: 'ผลน้ำแข็ง (Ice)',
    category: 'ผลปีศาจ',
    rarity: 'Uncommon',
    subType: 'Fruit',
    url: '/images/blox/ice.png',
  },
  {
    name: 'Falcon Fruit',
    th: 'ผลเหยี่ยว (Falcon)',
    category: 'ผลปีศาจ',
    rarity: 'Uncommon',
    subType: 'Fruit',
    url: '/images/blox/falcon.png',
  },
  {
    name: 'Flame Fruit',
    th: 'ผลไฟ (Flame)',
    category: 'ผลปีศาจ',
    rarity: 'Uncommon',
    subType: 'Fruit',
    url: '/images/blox/flame.png',
  },

  // ===================== COMMON FRUITS =====================
  {
    name: 'Smoke Fruit',
    th: 'ผลควัน (Smoke)',
    category: 'ผลปีศาจ',
    rarity: 'Common',
    subType: 'Fruit',
    url: '/images/blox/smoke.png',
  },
  {
    name: 'Spin Fruit',
    th: 'ผลหมุน (Spin)',
    category: 'ผลปีศาจ',
    rarity: 'Common',
    subType: 'Fruit',
    url: '/images/blox/spin.png',
  },
  {
    name: 'Rocket Fruit',
    th: 'ผลจรวด (Rocket)',
    category: 'ผลปีศาจ',
    rarity: 'Common',
    subType: 'Fruit',
    url: '/images/blox/rocket.png',
  },
  {
    name: 'Spring Fruit',
    th: 'ผลสปริง (Spring)',
    category: 'ผลปีศาจ',
    rarity: 'Common',
    subType: 'Fruit',
    url: '/images/blox/spring.png',
  },
  {
    name: 'Bomb Fruit',
    th: 'ผลระเบิด (Bomb)',
    category: 'ผลปีศาจ',
    rarity: 'Common',
    subType: 'Fruit',
    url: '/images/blox/bomb.png',
  },
  {
    name: 'Chop Fruit',
    th: 'ผลแยกส่วน (Chop)',
    category: 'ผลปีศาจ',
    rarity: 'Common',
    subType: 'Fruit',
    url: '/images/blox/chop.png',
  },

  // ===================== GAMEPASSES =====================
  {
    name: 'Dark Blade (Yoru)',
    th: 'ดาบดำโยรุ (Dark Blade Gamepass)',
    category: 'Gamepass',
    rarity: 'Mythical',
    subType: 'Gamepass',
    url: '/images/blox/dark_blade.png',
  },
  {
    name: '2x Mastery',
    th: 'เกมพาสคูณ 2 ความชำนาญ (2x Mastery)',
    category: 'Gamepass',
    rarity: 'Legendary',
    subType: 'Gamepass',
    url: '/images/blox/gamepass_2x_mastery.png',
  },
  {
    name: '2x Money',
    th: 'เกมพาสคูณ 2 เงินในเกม (2x Money)',
    category: 'Gamepass',
    rarity: 'Legendary',
    subType: 'Gamepass',
    url: '/images/blox/gamepass_2x_money.png',
  },
  {
    name: '2x Boss Drops',
    th: 'เกมพาสเพิ่มโอกาสดรอปบอส 2 เท่า (2x Boss Drops)',
    category: 'Gamepass',
    rarity: 'Legendary',
    subType: 'Gamepass',
    url: '/images/blox/gamepass_2x_drops.png',
  },
  {
    name: 'Fast Boats',
    th: 'เกมพาสเรือเร็ว (Fast Boats)',
    category: 'Gamepass',
    rarity: 'Rare',
    subType: 'Gamepass',
    url: '/images/blox/gamepass_fast_boats.png',
  },
  {
    name: 'Fruit Notifier',
    th: 'เกมพาสแจ้งเตือนผลเกิด (Fruit Notifier)',
    category: 'Gamepass',
    rarity: 'Mythical',
    subType: 'Gamepass',
    url: '/images/blox/gamepass_notifier.png',
  },
  {
    name: '+1 Fruit Storage',
    th: 'ช่องเก็บผลไม้ถาวร (+1 Fruit Storage)',
    category: 'Gamepass',
    rarity: 'Legendary',
    subType: 'Gamepass',
    url: '/images/blox/gamepass_fruit_storage.png',
  },

  // ===================== SWORDS & WEAPONS =====================
  {
    name: 'Cursed Dual Katana (CDK)',
    th: 'ดาบคู่ต้องสาปโอเด้ง (Cursed Dual Katana)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Sword',
    url: '/images/blox/cursed_dual_katana.png',
  },
  {
    name: 'True Triple Katana (TTK)',
    th: 'สามดาบแท้โซโร (True Triple Katana)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Sword',
    url: '/images/blox/true_triple_katana.png',
  },
  {
    name: 'Soul Guitar',
    th: 'กีตาร์วิญญาณบรุ๊ค (Soul Guitar)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Gun',
    url: '/images/blox/soul_guitar.png',
  },
  {
    name: 'Hallow Scythe',
    th: 'เคียวฮาโลวีน (Hallow Scythe)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Sword',
    url: '/images/blox/hallow_scythe.png',
  },
  {
    name: 'Shark Anchor',
    th: 'สมอฉลามทะเลลึก (Shark Anchor)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Sword',
    url: '/images/blox/shark_anchor.png',
  },
  {
    name: 'Fox Lamp',
    th: 'โคมไฟจิ้งจอกคิตสึเนะ (Fox Lamp)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Sword',
    url: '/images/blox/fox_lamp.png',
  },
  {
    name: 'Dragon Trident',
    th: 'ตรีศูลมังกร (Dragon Trident)',
    category: 'ไอเทม',
    rarity: 'Rare',
    subType: 'Sword',
    url: '/images/blox/dragon_trident.png',
  },
  {
    name: 'Spikey Trident',
    th: 'ตรีศูลหนามโมจิ (Spikey Trident)',
    category: 'ไอเทม',
    rarity: 'Rare',
    subType: 'Sword',
    url: '/images/blox/spikey_trident.png',
  },
  {
    name: 'Tushita',
    th: 'ดาบทูชิตะ (Tushita Sword)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Sword',
    url: '/images/blox/tushita.png',
  },
  {
    name: 'Yama',
    th: 'ดาบยามา (Yama Sword)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Sword',
    url: '/images/blox/yama.png',
  },
  {
    name: 'Saber',
    th: 'ดาบเซเบอร์แชงคูส (Saber)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Sword',
    url: '/images/blox/saber.png',
  },
  {
    name: 'Rengoku',
    th: 'ดาบเร็นโกคุ (Rengoku)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Sword',
    url: '/images/blox/rengoku.png',
  },

  // ===================== GUNS =====================
  {
    name: 'Acidum Rifle',
    th: 'ปืนไรเฟิลกรด (Acidum Rifle)',
    category: 'ไอเทม',
    rarity: 'Rare',
    subType: 'Gun',
    url: '/images/blox/acidum_rifle.png',
  },
  {
    name: 'Kabucha',
    th: 'ปืนคาบูชาอุซป (Kabucha)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Gun',
    url: '/images/blox/kabucha.png',
  },

  // ===================== FIGHTING STYLES =====================
  {
    name: 'Godhuman',
    th: 'หมัดก็อดฮิวแมน (Godhuman Fighting Style)',
    category: 'บริการ',
    rarity: 'Mythical',
    subType: 'FightingStyle',
    url: '/images/blox/godhuman.png',
  },
  {
    name: 'Sanguine Art',
    th: 'หมัดเลือดซังกวิน (Sanguine Art)',
    category: 'บริการ',
    rarity: 'Mythical',
    subType: 'FightingStyle',
    url: '/images/blox/sanguine_art.png',
  },
  {
    name: 'Dragon Talon',
    th: 'หมัดกรงเล็บมังกร (Dragon Talon)',
    category: 'บริการ',
    rarity: 'Legendary',
    subType: 'FightingStyle',
    url: '/images/blox/dragon_talon.png',
  },
  {
    name: 'Electric Claw',
    th: 'หมัดกรงเล็บไฟฟ้า (Electric Claw)',
    category: 'บริการ',
    rarity: 'Legendary',
    subType: 'FightingStyle',
    url: '/images/blox/electric_claw.png',
  },
  {
    name: 'Death Step',
    th: 'หมัดขาไฟเดธสเต็ป (Death Step)',
    category: 'บริการ',
    rarity: 'Legendary',
    subType: 'FightingStyle',
    url: '/images/blox/death_step.png',
  },
  {
    name: 'Sharkman Karate',
    th: 'คาราเต้เงือก V2 (Sharkman Karate)',
    category: 'บริการ',
    rarity: 'Legendary',
    subType: 'FightingStyle',
    url: '/images/blox/sharkman_karate.png',
  },

  // ===================== MATERIALS & ACCESSORIES & SERVICES =====================
  {
    name: 'Mirror Fractal',
    th: 'กระจกมิเรอร์แฟรคทัล (Mirror Fractal ดอปจาก Dough King)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/mirror_fractal.png',
  },
  {
    name: 'Leviathan Heart',
    th: 'หัวใจเลเวียธาน (Leviathan Heart สำหรับทำ Sanguine Art)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/leviathan_heart.png',
  },
  {
    name: 'Dark Fragment',
    th: 'เศษความมืดหนวดดำ (Dark Fragment สำหรับทำ Soul Guitar)',
    category: 'ไอเทม',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/dark_fragment.png',
  },
  {
    name: 'Valkyrie Helm',
    th: 'หมวกวาลคิรี (Valkyrie Helm ดรอปจาก rip_indra)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Accessory',
    url: '/images/blox/valkyrie_helm.png',
  },
  {
    name: 'Dark Coat',
    th: 'ผ้าคลุมดำหนวดดำ (Dark Coat)',
    category: 'ไอเทม',
    rarity: 'Mythical',
    subType: 'Accessory',
    url: '/images/blox/dark_coat.png',
  },
  {
    name: 'Race V4 Awakening Full Gear',
    th: 'บริการทำเผ่า V4 ทุกเผ่า ตื่นเต็มขั้น Full Gear',
    category: 'บริการ',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/race_v4.png',
  },
  {
    name: 'Beli Farm (Normal)',
    th: 'บริการฟาร์มเงินเขียว 1M (ไม่มีคูณ 2)',
    category: 'บริการ',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/beli_farm.png',
  },
  {
    name: 'Beli Farm (2x Money)',
    th: 'บริการฟาร์มเงินเขียว 1M (มีคูณ 2)',
    category: 'บริการ',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/gamepass_2x_money.png',
  },
  {
    name: 'Level Farm (100 Levels)',
    th: 'บริการฟาร์มเลเวล 100 เลเวล (10 บาท)',
    category: 'บริการ',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/level_farm.png',
  },
  {
    name: 'Cursed Dual Katana Service (Has Swords)',
    th: 'บริการทำดาบคู่โอเด้ง CDK (มีดาบ Yama + Tushita แล้ว)',
    category: 'บริการ',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/cursed_dual_katana.png',
  },
  {
    name: 'Cursed Dual Katana Service (No Swords)',
    th: 'บริการทำดาบคู่โอเด้ง CDK (ยังไม่มีดาบ Yama และ Tushita)',
    category: 'บริการ',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/cursed_dual_katana.png',
  },

  // --------------------------------------------------------------------------
  // สกินผลปีศาจล่าสุด (Fruit Skins / Chromatic Fruit Skins)
  // --------------------------------------------------------------------------
  // ==========================
  // สกินผลปีศาจ (Fruit Skins - Chromatic / Special Events)
  // ==========================
  {
    name: 'Yellow Lightning Rumble Skin',
    th: 'สกินสายฟ้าสีเหลือง (Yellow Lightning Rumble Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_yellow_lightning.png',
  },
  {
    name: 'Green Lightning Rumble Skin',
    th: 'สกินสายฟ้าสีเขียว (Green Lightning Rumble Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_green_lightning.png',
  },
  {
    name: 'Purple Lightning Rumble Skin',
    th: 'สกินสายฟ้าสีม่วง (Purple Lightning Rumble Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_purple_lightning.png',
  },
  {
    name: 'Red Lightning Rumble Skin',
    th: 'สกินสายฟ้าสีแดง (Red Lightning Rumble Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_red_lightning.png',
  },
  {
    name: 'Dragon Eclipse Skin',
    th: 'สกินมังกรสุริยุปราคา (Dragon Eclipse Skin)',
    category: 'สกินผล',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/skin_dragon_eclipse.png',
  },
  {
    name: 'Ember Dragon Skin',
    th: 'สกินมังกรเพลิง Ember (Ember Dragon Skin)',
    category: 'สกินผล',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/skin_ember_dragon.png',
  },
  {
    name: 'Galaxy Imperium Kitsune Skin',
    th: 'สกินคิตสึเนะดาราจักร (Galaxy Imperium Kitsune Skin)',
    category: 'สกินผล',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/skin_galaxy_kitsune.png',
  },
  {
    name: 'Crimson Kitsune Skin',
    th: 'สกินคิตสึเนะเพลิงโลหิต (Crimson Kitsune Skin)',
    category: 'สกินผล',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/skin_crimson_kitsune.png',
  },
  {
    name: 'Divine Portal Skin',
    th: 'สกินประตูมิติเทวะ (Divine Portal Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_divine_portal.png',
  },
  {
    name: 'Celestial Pain Skin',
    th: 'สกินเพนสวรรค์ (Celestial Pain Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_celestial_pain.png',
  },
  {
    name: 'Glacier Eagle Skin',
    th: 'สกินอินทรีเหมันต์น้ำแข็ง (Glacier Eagle Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_glacier_eagle.png',
  },
  {
    name: 'Matrix Eagle Skin',
    th: 'สกินอินทรีเมทริกซ์ (Matrix Eagle Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_matrix_eagle.png',
  },
  {
    name: 'Nuclear Bomb Skin',
    th: 'สกินระเบิดนิวเคลียร์ (Nuclear Bomb Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_nuclear_bomb.png',
  },
  {
    name: 'Celebration Bomb Skin',
    th: 'สกินระเบิดเฉลิมฉลอง (Celebration Bomb Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_celebration_bomb.png',
  },
  {
    name: 'Emerald Diamond Skin',
    th: 'สกินเพชรมรกต (Emerald Diamond Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_emerald_diamond.png',
  },
  {
    name: 'Ruby Diamond Skin',
    th: 'สกินเพชรทับทิม (Ruby Diamond Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_ruby_diamond.png',
  },
  {
    name: 'Topaz Diamond Skin',
    th: 'สกินเพชรบุษราคัม (Topaz Diamond Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_topaz_diamond.png',
  },
  {
    name: 'Arcsteel Magnet Skin',
    th: 'สกินแม่เหล็กสตีล (Arcsteel Magnet Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_arcsteel_magnet.png',
  },
  {
    name: 'Starlight Gravity Skin',
    th: 'สกินแรงโน้มถ่วงประกายดาว (Starlight Gravity Skin)',
    category: 'สกินผล',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/skin_starlight_gravity.png',
  },
  {
    name: 'Scarlet Ghost Skin',
    th: 'สกินวิญญาณสีชาด (Scarlet Ghost Skin)',
    category: 'สกินผล',
    rarity: 'Rare',
    subType: 'Material',
    url: '/images/blox/skin_scarlet_ghost.png',
  },
  {
    name: 'Lime Blade Skin',
    th: 'สกินดาบมะนาวเรืองแสง (Lime Blade Skin)',
    category: 'สกินผล',
    rarity: 'Legendary',
    subType: 'Material',
    url: '/images/blox/skin_lime_blade.png',
  },
  {
    name: 'Runic Fiend Skin',
    th: 'สกินอสูรรูนิก (Runic Fiend Skin)',
    category: 'สกินผล',
    rarity: 'Mythical',
    subType: 'Material',
    url: '/images/blox/skin_runic_fiend.png',
  },
];

/**
 * ฟังก์ชันช่วยตรวจสอบและแปลง Image URL ให้เป็นรูปภาพ Blox Fruits ในระบบ
 * หาก URL ภายนอกเสีย หรือเป็น URL เก่าจาก Fandom จะแปลงเป็นภาพคุณภาพสูงที่บันทึกไว้ในเครื่องทันที
 */
export function resolveBloxImageUrl(url?: string | null, name?: string): string {
  // 1. ถ้าเป็น Data URL (Base64 ที่ผู้ใช้อัปโหลดจากเครื่อง) ให้แสดงภาพนั้นทันที
  if (url && url.startsWith('data:image/')) {
    return url;
  }

  // 2. ถ้าเป็น URL ภายในระบบ /images/ หรือ Blob URL ให้แสดงทันที
  if (url && (url.startsWith('/images/') || url.startsWith('blob:'))) {
    return url;
  }

  // 3. ถ้าเป็น URL รูปภาพภายนอกที่ถูกต้อง (ไม่ใช่ลิงก์เสียของ Wikia เก่า) ให้ใช้ทันที
  if (
    url && 
    (url.startsWith('http://') || url.startsWith('https://')) && 
    !url.includes('static.wikia.nocookie.net/roblox-blox-piece/images/')
  ) {
    return url;
  }

  // 4. ค้นหารูปตามชื่อสินค้า (ใช้เฉพาะชื่อสินค้า ห้ามนำ base64 หรือ url มาปนเพื่อป้องกันคำซ้ำ)
  const target = (name || '').toLowerCase();

  // Fruit Skins (ตรวจสอบก่อนผลปกติเพื่อให้ได้สกินที่ถูกต้องตรงเป๊ะ)
  // สายฟ้า 4 สี (Yellow, Green, Purple, Red)
  if (target.includes('yellow') && (target.includes('lightning') || target.includes('rumble') || target.includes('สายฟ้า'))) return '/images/blox/skin_yellow_lightning.png';
  if (target.includes('สายฟ้าสีเหลือง') || target.includes('สายฟ้าเหลือง')) return '/images/blox/skin_yellow_lightning.png';
  if (target.includes('green') && (target.includes('lightning') || target.includes('rumble') || target.includes('สายฟ้า'))) return '/images/blox/skin_green_lightning.png';
  if (target.includes('สายฟ้าสีเขียว') || target.includes('สายฟ้าเขียว')) return '/images/blox/skin_green_lightning.png';
  if (target.includes('purple') && (target.includes('lightning') || target.includes('rumble') || target.includes('สายฟ้า'))) return '/images/blox/skin_purple_lightning.png';
  if (target.includes('สายฟ้าสีม่วง') || target.includes('สายฟ้าม่วง')) return '/images/blox/skin_purple_lightning.png';
  if (target.includes('red') && (target.includes('lightning') || target.includes('rumble') || target.includes('สายฟ้า'))) return '/images/blox/skin_red_lightning.png';
  if (target.includes('สายฟ้าสีแดง') || target.includes('สายฟ้าแดง')) return '/images/blox/skin_red_lightning.png';

  // มังกร & คิตสึเนะสกิน
  if (target.includes('eclipse') || target.includes('สุริยุปราคา')) return '/images/blox/skin_dragon_eclipse.png';
  if (target.includes('ember') || target.includes('มังกรเพลิง') || (target.includes('มังกร') && target.includes('ember'))) return '/images/blox/skin_ember_dragon.png';
  if (target.includes('galaxy') || target.includes('ดาราจักร')) return '/images/blox/skin_galaxy_kitsune.png';
  if (target.includes('crimson') || target.includes('เพลิงโลหิต')) return '/images/blox/skin_crimson_kitsune.png';

  // สกินผลพิเศษอื่นๆ
  if (target.includes('divine') || target.includes('เทวะ') || (target.includes('สกิน') && target.includes('portal'))) return '/images/blox/skin_divine_portal.png';
  if (target.includes('celestial') || target.includes('เพนสวรรค์')) return '/images/blox/skin_celestial_pain.png';
  if (target.includes('glacier') || target.includes('เหมันต์') || (target.includes('สกิน') && target.includes('glacier'))) return '/images/blox/skin_glacier_eagle.png';
  if (target.includes('matrix') || target.includes('เมทริกซ์') || (target.includes('สกิน') && target.includes('matrix'))) return '/images/blox/skin_matrix_eagle.png';
  if (target.includes('celebration') || target.includes('เฉลิมฉลอง')) return '/images/blox/skin_celebration_bomb.png';
  if (target.includes('nuclear') || target.includes('นิวเคลียร์')) return '/images/blox/skin_nuclear_bomb.png';
  if (target.includes('emerald') || target.includes('มรกต')) return '/images/blox/skin_emerald_diamond.png';
  if (target.includes('ruby') || target.includes('ทับทิม')) return '/images/blox/skin_ruby_diamond.png';
  if (target.includes('topaz') || target.includes('บุษราคัม')) return '/images/blox/skin_topaz_diamond.png';
  if (target.includes('arcsteel') || target.includes('อาร์คสตีล') || (target.includes('สกิน') && target.includes('magnet'))) return '/images/blox/skin_arcsteel_magnet.png';
  if (target.includes('starlight') || target.includes('ประกายดาว') || (target.includes('สกิน') && target.includes('gravity'))) return '/images/blox/skin_starlight_gravity.png';
  if (target.includes('scarlet') || target.includes('สีชาด') || (target.includes('สกิน') && target.includes('ghost'))) return '/images/blox/skin_scarlet_ghost.png';
  if (target.includes('lime') || target.includes('มะนาว') || (target.includes('สกิน') && target.includes('blade'))) return '/images/blox/skin_lime_blade.png';
  if (target.includes('runic') || target.includes('รูนิก') || target.includes('fiend') || target.includes('อสูรรูนิก')) return '/images/blox/skin_runic_fiend.png';

  // Mythical
  if (target.includes('kitsune') || target.includes('คิตสึเนะ') || target.includes('คิตสิเนะ')) return '/images/blox/kitsune.png';
  if (target.includes('dragon_trident') || target.includes('ตรีศูลมังกร')) return '/images/blox/dragon_trident.png';
  if (target.includes('dragon') || target.includes('มังกร')) return '/images/blox/dragon.png';
  if (target.includes('leopard') || target.includes('เสือ')) return '/images/blox/leopard.png';
  if (target.includes('dough') || target.includes('โมจิ')) return '/images/blox/dough.png';
  if (target.includes('trex') || target.includes('t-rex') || target.includes('ทีเร็กซ์')) return '/images/blox/trex.png';
  if (target.includes('mammoth') || target.includes('ช้าง') || target.includes('แมมมอธ')) return '/images/blox/mammoth.png';
  if (target.includes('spirit') || target.includes('วิญญาณ')) return '/images/blox/spirit.png';
  if (target.includes('control') || target.includes('คอนโทรล')) return '/images/blox/control.png';
  if (target.includes('venom') || target.includes('พิษ')) return '/images/blox/venom.png';
  if (target.includes('shadow') || target.includes('เงา')) return '/images/blox/shadow.png';
  if (target.includes('gravity') || target.includes('แรงโน้มถ่วง')) return '/images/blox/gravity.png';

  // Legendary
  if (target.includes('blizzard') || target.includes('พายุหิมะ') || target.includes('บลิซซาร์ด')) return '/images/blox/blizzard.png';
  if (target.includes('portal') || target.includes('ประตู') || target.includes('วาร์ป')) return '/images/blox/portal.png';
  if (target.includes('rumble') || target.includes('lightning') || target.includes('สายฟ้า')) return '/images/blox/rumble.png';
  if (target.includes('buddha') || target.includes('พระ')) return '/images/blox/buddha.png';
  if (target.includes('sound') || target.includes('เสียง')) return '/images/blox/sound.png';
  if (target.includes('phoenix') || target.includes('ฟีนิกซ์') || target.includes('นกฟีนิกซ์')) return '/images/blox/phoenix.png';
  if (target.includes('pain') || target.includes('เพน') || target.includes('อุ้งเท้าหมี')) return '/images/blox/pain.png';
  if (target.includes('spider') || target.includes('ใย') || target.includes('สไปเดอร์')) return '/images/blox/spider.png';
  if (target.includes('love') || target.includes('รัก')) return '/images/blox/love.png';
  if (target.includes('quake') || target.includes('สั่น') || target.includes('แผ่นดินไหว')) return '/images/blox/quake.png';

  // Rare
  if (target.includes('magma') || target.includes('แมกม่า') || target.includes('ลาวา')) return '/images/blox/magma.png';
  if (target.includes('ghost') || target.includes('ผี')) return '/images/blox/ghost.png';
  if (target.includes('barrier') || target.includes('บาเรีย')) return '/images/blox/barrier.png';
  if (target.includes('rubber') || target.includes('ยาง')) return '/images/blox/rubber.png';
  if (target.includes('light') || target.includes('แสง')) return '/images/blox/light.png';
  if (target.includes('diamond') || target.includes('เพชร')) return '/images/blox/diamond.png';

  // Uncommon & Common
  if (target.includes('dark_blade') || target.includes('dark blade') || target.includes('โยรุ') || target.includes('ดาบดำ')) return '/images/blox/dark_blade.png';
  if (target.includes('dark_coat') || target.includes('ผ้าคลุมดำ')) return '/images/blox/dark_coat.png';
  if (target.includes('dark_fragment') || target.includes('เศษความมืด')) return '/images/blox/dark_fragment.png';
  if (target.includes('dark') || target.includes('มืด')) return '/images/blox/dark.png';
  if (target.includes('sand') || target.includes('ทราย')) return '/images/blox/sand.png';
  if (target.includes('ice') || target.includes('น้ำแข็ง')) return '/images/blox/ice.png';
  if (target.includes('flame') || target.includes('ไฟ')) return '/images/blox/flame.png';
  if (target.includes('falcon') || target.includes('เหยี่ยว') || target.includes('eagle') || target.includes('อินทรี')) return '/images/blox/falcon.png';
  if (target.includes('smoke') || target.includes('ควัน')) return '/images/blox/smoke.png';
  if (target.includes('spin') || target.includes('หมุน')) return '/images/blox/spin.png';
  if (target.includes('rocket') || target.includes('จรวด')) return '/images/blox/rocket.png';
  if (target.includes('chop') || target.includes('สับ') || target.includes('แยกส่วน')) return '/images/blox/chop.png';
  if (target.includes('spring') || target.includes('สปริง')) return '/images/blox/spring.png';
  if (target.includes('bomb') || target.includes('ระเบิด')) return '/images/blox/bomb.png';

  // Gamepass
  if (target.includes('2x_mastery') || target.includes('2x mastery') || target.includes('มาสเตอร์')) return '/images/blox/gamepass_2x_mastery.png';
  if (target.includes('2x_money') || target.includes('2x money') || target.includes('เงินคูณ 2') || target.includes('เงินx2')) return '/images/blox/gamepass_2x_money.png';
  if (target.includes('2x_drops') || target.includes('2x boss') || target.includes('ดรอป')) return '/images/blox/gamepass_2x_drops.png';
  if (target.includes('fast_boats') || target.includes('fast boat') || target.includes('เรือเร็ว')) return '/images/blox/gamepass_fast_boats.png';
  if (target.includes('fruit_notifier') || target.includes('notifier') || target.includes('แจ้งเตือนผล')) return '/images/blox/gamepass_notifier.png';
  if (target.includes('fruit_storage') || target.includes('storage') || target.includes('เก็บผล') || target.includes('กระเป๋า')) return '/images/blox/gamepass_fruit_storage.png';

  // Weapons & Swords
  if (target.includes('cursed_dual_katana') || target.includes('cdk') || target.includes('ดาบคู่')) return '/images/blox/cursed_dual_katana.png';
  if (target.includes('true_triple_katana') || target.includes('ttk') || target.includes('สามดาบแท้')) return '/images/blox/true_triple_katana.png';
  if (target.includes('soul_guitar') || target.includes('กีตาร์')) return '/images/blox/soul_guitar.png';
  if (target.includes('hallow_scythe') || target.includes('เคียว')) return '/images/blox/hallow_scythe.png';
  if (target.includes('shark_anchor') || target.includes('สมอ')) return '/images/blox/shark_anchor.png';
  if (target.includes('fox_lamp') || target.includes('โคมจิ้งจอก')) return '/images/blox/fox_lamp.png';
  if (target.includes('spikey_trident') || target.includes('ตรีศูลหนาม')) return '/images/blox/spikey_trident.png';
  if (target.includes('tushita') || target.includes('ทูชิตะ')) return '/images/blox/tushita.png';
  if (target.includes('yama') || target.includes('ยามา')) return '/images/blox/yama.png';
  if (target.includes('saber') || target.includes('เซเบอร์')) return '/images/blox/saber.png';
  if (target.includes('rengoku') || target.includes('เร็นโกคุ')) return '/images/blox/rengoku.png';

  // Guns
  if (target.includes('acidum') || target.includes('ปืนกรด')) return '/images/blox/acidum_rifle.png';
  if (target.includes('kabucha') || target.includes('คาบูชา')) return '/images/blox/kabucha.png';

  // Fighting Styles
  if (target.includes('godhuman') || target.includes('ก็อดฮิวแมน')) return '/images/blox/godhuman.png';
  if (target.includes('sanguine') || target.includes('ซังกวิน')) return '/images/blox/sanguine_art.png';
  if (target.includes('dragon_talon') || target.includes('กรงเล็บมังกร')) return '/images/blox/dragon_talon.png';
  if (target.includes('electric_claw') || target.includes('กรงเล็บไฟฟ้า')) return '/images/blox/electric_claw.png';
  if (target.includes('death_step') || target.includes('ขาไฟ')) return '/images/blox/death_step.png';
  if (target.includes('sharkman') || target.includes('หมัดมนุษย์เงือก') || target.includes('คาราเต้')) return '/images/blox/sharkman_karate.png';

  // Materials & Services
  if (target.includes('mirror_fractal') || target.includes('กระจก')) return '/images/blox/mirror_fractal.png';
  if (target.includes('leviathan') || target.includes('หัวใจ')) return '/images/blox/leviathan_heart.png';
  if (target.includes('valkyrie') || target.includes('วาลคิรี')) return '/images/blox/valkyrie_helm.png';
  if (target.includes('v4') || target.includes('เผ่า v4') || target.includes('awakening')) return '/images/blox/race_v4.png';
  if (target.includes('คูณ 2') || target.includes('คูณ2') || target.includes('2x money') || target.includes('2x_money')) return '/images/blox/gamepass_2x_money.png';
  if (target.includes('beli') || target.includes('เงินเขียว') || target.includes('ฟาร์มเงิน') || target.includes('เงิน')) return '/images/blox/beli_farm.png';
  if (target.includes('level') || target.includes('เลเวล') || target.includes('ฟาร์มเลเวล') || target.includes('เวล')) return '/images/blox/level_farm.png';

  // If a valid custom external URL was provided (not broken Wikia), use it
  if (url && !url.includes('static.wikia.nocookie.net/roblox-blox-piece/images/')) {
    return url;
  }

  // Default fallback
  return '/images/blox/kitsune.png';
}
