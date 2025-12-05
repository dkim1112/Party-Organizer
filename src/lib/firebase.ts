import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Environment-based Firebase configuration
const getFirebaseConfig = () => {
  const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';

  if (isDevelopment) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEV_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_DEV_APP_ID,
    };
  } else {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_PROD_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_PROD_APP_ID,
    };
  }
};

const firebaseConfig = getFirebaseConfig();

// Debug logging
if (typeof window !== 'undefined') {
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development';
  console.log(`🔥 Firebase Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  console.log(`🔥 Project ID: ${firebaseConfig.projectId}`);
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Development mode: Skip emulators for now due to Java requirement
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // Emulator setup commented out due to Java dependency
    // Will use alternative approach for development
    console.log('🛠️ Development mode: Using production Firebase with fallback auth');
  } catch (error: any) {
    // Development mode fallback
    console.log('⚠️ Development mode setup:', error.message);
  }
}

export default app;