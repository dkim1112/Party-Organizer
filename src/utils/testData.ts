import { createUser, createRegistration, getCurrentEvent } from '@/lib/firestore';

interface TestUser {
  name: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  age: number;
}

const testUsers: TestUser[] = [
  // Male users
  { name: '김민수', phoneNumber: '010-1111-1111', gender: 'male', age: 25 },
  { name: '이준호', phoneNumber: '010-2222-2222', gender: 'male', age: 28 },
  { name: '박성진', phoneNumber: '010-3333-3333', gender: 'male', age: 24 },
  { name: '최대현', phoneNumber: '010-4444-4444', gender: 'male', age: 27 },
  { name: '정우석', phoneNumber: '010-5555-5555', gender: 'male', age: 29 },

  // Female users
  { name: '김지은', phoneNumber: '010-6666-6666', gender: 'female', age: 23 },
  { name: '이소영', phoneNumber: '010-7777-7777', gender: 'female', age: 26 },
  { name: '박민지', phoneNumber: '010-8888-8888', gender: 'female', age: 24 },
  { name: '최유진', phoneNumber: '010-9999-9999', gender: 'female', age: 25 },
  { name: '정혜원', phoneNumber: '010-0000-0000', gender: 'female', age: 27 },
];

export const insertTestUsers = async (count?: number) => {
  try {
    console.log('🚀 Starting test user insertion...');

    // Get current event
    const currentEvent = await getCurrentEvent();
    if (!currentEvent) {
      throw new Error('No current event found. Please create an event first.');
    }

    console.log(`📅 Using event: ${currentEvent.title} (ID: ${currentEvent.id})`);

    const usersToCreate = count ? testUsers.slice(0, count) : testUsers;
    const results = [];

    for (let i = 0; i < usersToCreate.length; i++) {
      const testUser = usersToCreate[i];

      console.log(`👤 Creating user ${i + 1}/${usersToCreate.length}: ${testUser.name}`);

      // Create user (without kakaoId)
      const userId = await createUser({
        name: testUser.name,
        phoneNumber: testUser.phoneNumber,
        gender: testUser.gender,
        age: testUser.age
        // No kakaoId - this will be undefined
      });

      console.log(`✅ User created with ID: ${userId}`);

      // Create registration
      const registrationId = await createRegistration({
        userId,
        eventId: currentEvent.id,
        paymentStatus: 'completed',
        paymentId: `test_payment_${Date.now()}_${i}`,
        questionnaireAnswers: {}
      });

      console.log(`📝 Registration created with ID: ${registrationId}`);

      results.push({
        user: { id: userId, ...testUser },
        registrationId
      });

      // Small delay to prevent overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Successfully created ${results.length} test users and registrations!`);

    // Log summary
    const maleCount = results.filter(r => r.user.gender === 'male').length;
    const femaleCount = results.filter(r => r.user.gender === 'female').length;

    console.log(`📊 Summary:`);
    console.log(`- Male users: ${maleCount}`);
    console.log(`- Female users: ${femaleCount}`);
    console.log(`- Total users: ${results.length}`);

    return results;

  } catch (error) {
    console.error('❌ Error inserting test users:', error);
    throw error;
  }
};

export const clearTestUsers = async () => {
  console.log('🗑️ Note: To clear test users, you need to manually delete them from Firebase Console');
  console.log('or implement a cleanup function with admin privileges.');
};

// Utility to insert specific number of users
export const insertTestUsersWithCount = async (maleCount: number, femaleCount: number) => {
  const maleUsers = testUsers.filter(user => user.gender === 'male').slice(0, maleCount);
  const femaleUsers = testUsers.filter(user => user.gender === 'female').slice(0, femaleCount);

  const selectedUsers = [...maleUsers, ...femaleUsers];

  console.log(`🎯 Creating ${maleCount} male and ${femaleCount} female users`);

  return insertTestUsers(selectedUsers.length);
};