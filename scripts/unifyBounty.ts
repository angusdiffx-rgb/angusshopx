import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  // 1. Delete the 3 separated items
  const toDelete = ['prod_bounty_10m', 'prod_bounty_20m', 'prod_bounty_30m'];
  for (const id of toDelete) {
    try {
      await deleteDoc(doc(db, 'products', id));
      console.log('Deleted legacy product:', id);
    } catch (e) {
      console.error('Error deleting:', id, e);
    }
  }

  // 2. Create the unified product
  const unifiedProduct = {
    productId: 'prod_bounty_hunt',
    name: 'บริการล่าค่าหัว Blox Fruits (10M / 20M / 30M)',
    price: 500,
    oldPrice: 650,
    category: 'บริการ',
    rarity: 'Mythical',
    deliveryType: 'manual_service',
    fruitType: 'Permanent',
    stock: 999,
    isActive: true,
    isFeatured: true,
    featured: true,
    isBestSeller: true,
    imageUrl: '/images/blox/bounty_hunt_30m.png',
    image: '/images/blox/bounty_hunt_30m.png',
    slug: 'bounty-hunting-service',
    shortDescription: 'บริการรับฟาร์มล่าค่าหัว Blox Fruits เลือกระดับได้ 10M (500฿) / 20M (1,000฿) / 30M (1,500฿) เพดานสูงสุดในเกม',
    description: `บริการรับฟาร์มล่าค่าหัว Blox Fruits ปลอดภัย 100% เลือกระดับและฝ่ายได้ตามต้องการ

👑 แพ็กเกจระดับค่าหัวให้เลือก:
• 10M Bounty / Honor (฿500): เริ่มต้นสายล่า ปลดล็อกฉายานักล่า + โบนัสบัฟ PvP
• 20M Bounty / Honor (฿1,000): Max PvP Boost โบนัสดาเมจและเกราะป้องกันสูงสุดในเกม Blox Fruits
• 30M Bounty / Honor (฿1,500): เพดานค่าหัวสูงสุดในเกม (30,000,000 Max Cap) สมศักดิ์ศรีราชาโจรสลัด ปลดล็อกฉายาระดับตำนาน (The Real Demon / Emperor)

📌 จุดเด่นและสิทธิประโยชน์:
- สามารถเลือกได้ทั้งฝ่ายโจรสลัด (Pirate Bounty 🏴‍☠️) หรือฝ่ายทหารเรือ (Marine Honor ⚓)
- ทีมงานมืออาชีพ ดูแลอย่างปลอดภัย 100% ไม่ใช้โปรแกรมเสี่ยงแบน
- สามารถติดตามคิวงานและสถานะการฟาร์มได้ตลอด 24 ชม. ในระบบประวัติการสั่งซื้อ`,
    instructionsTitle: 'ขั้นตอนการรับบริการล่าค่าหัว Blox Fruits',
    deliveryInstructions: 'ทีมงานได้รับคำสั่งซื้อบริการล่าค่าหัวเรียบร้อยแล้ว กำลังดำเนินการฟาร์มค่าหัวตามคิวงานอย่างปลอดภัย แนะนำปิด 2-Step Verification ชั่วคราวเพื่อความรวดเร็ว',
    serverLinkTitle: 'ติดต่อทีมงานฟาร์มค่าหัว',
    claimCodeTitle: 'รหัสคิวงานล่าค่าหัว',
    claimCode: '',
    tradeServerLink: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'products', 'prod_bounty_hunt'), unifiedProduct, { merge: true });
  console.log('Saved unified bounty product:', unifiedProduct.productId, unifiedProduct.name);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
