import { createMenuItem } from '@/lib/firestore';

const sampleMenuItems = [
  '생맥주',
  '소주',
  '와인',
  '칵테일',
  '위스키',
  '진토닉',
  '하이볼',
  '맥주안주',
];

export const seedMenuItems = async () => {
  console.log('🍽️ Starting to seed menu items...');

  const results = [];

  for (const itemName of sampleMenuItems) {
    try {
      const itemId = await createMenuItem(itemName);
      results.push({ id: itemId, name: itemName });
      console.log(`✅ Created menu item: ${itemName}`);
    } catch (error) {
      console.error(`❌ Failed to create menu item: ${itemName}`, error);
    }
  }

  console.log(`🎉 Menu seeding completed: ${results.length}/${sampleMenuItems.length} items created`);
  return results;
};