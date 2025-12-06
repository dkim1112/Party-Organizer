import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { User, Event, Registration, EventStatus, MenuItem, Question, QuestionnaireAnswers } from "@/types";

// Collections
const USERS_COLLECTION = "users";
const EVENTS_COLLECTION = "events";
const REGISTRATIONS_COLLECTION = "registrations";

// User operations
export const createUser = async (
  userData: Omit<User, "id" | "createdAt" | "updatedAt">
) => {
  try {
    // Check if user already exists by Kakao ID
    if (userData.kakaoId) {
      const existingUser = await getUserByKakaoId(userData.kakaoId);
      if (existingUser) {
        console.log("User already exists with Kakao ID:", userData.kakaoId);
        return existingUser.id;
      }
    }

    const userDoc = await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return userDoc.id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserByKakaoId = async (
  kakaoId: string
): Promise<User | null> => {
  try {
    console.log(`🔍 Searching for user with Kakao ID: ${kakaoId}`);
    const q = query(
      collection(db, USERS_COLLECTION),
      where("kakaoId", "==", kakaoId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() } as User;
      console.log("✅ Found existing user:", user.id);
      return user;
    }

    console.log("❌ No user found with Kakao ID:", kakaoId);
    return null;
  } catch (error) {
    console.error("Error searching user by Kakao ID:", error);
    return null;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// Event operations
export const getCurrentEvent = async (): Promise<Event | null> => {
  try {
    // 더 간단한 쿼리로 변경 - 인덱스 불필요
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where("status", "==", "open"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const eventDoc = querySnapshot.docs[0];
      return { id: eventDoc.id, ...eventDoc.data() } as Event;
    }

    // 'open' 상태가 없으면 'full' 상태 확인
    const qFull = query(
      collection(db, EVENTS_COLLECTION),
      where("status", "==", "full"),
      limit(1)
    );
    const fullSnapshot = await getDocs(qFull);

    if (!fullSnapshot.empty) {
      const eventDoc = fullSnapshot.docs[0];
      return { id: eventDoc.id, ...eventDoc.data() } as Event;
    }

    return null;
  } catch (error) {
    console.error("Error getting current event:", error);
    throw error;
  }
};

export const getEventStatus = async (
  eventId: string
): Promise<EventStatus | null> => {
  try {
    const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
    if (!eventDoc.exists()) return null;

    const event = eventDoc.data() as Event;

    // Use event's maxSlots or default to 5
    const maxMaleSlots = event.maxMaleSlots || 5;
    const maxFemaleSlots = event.maxFemaleSlots || 5;

    return {
      maleSlots: maxMaleSlots,
      femaleSlots: maxFemaleSlots,
      totalSlots: maxMaleSlots + maxFemaleSlots,
      availableMaleSlots: maxMaleSlots - event.maleCount,
      availableFemaleSlots: maxFemaleSlots - event.femaleCount,
      canJoin:
        (maxMaleSlots - event.maleCount > 0 ||
          maxFemaleSlots - event.femaleCount > 0) &&
        event.status === "open",
    };
  } catch (error) {
    console.error("Error getting event status:", error);
    throw error;
  }
};

export const createEvent = async (
  eventData: Omit<Event, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const eventDoc = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return eventDoc.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Registration operations
export const createRegistration = async (
  registrationData: Omit<Registration, "id" | "registeredAt" | "updatedAt">
) => {
  try {
    console.log("🚀 Starting createRegistration with data:", registrationData);

    // Start a batch write to update both registration and event
    const registrationDoc = await addDoc(
      collection(db, REGISTRATIONS_COLLECTION),
      {
        ...registrationData,
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    console.log("✅ Registration document created:", registrationDoc.id);

    // Update event participant count
    console.log("📝 Getting user by ID:", registrationData.userId);
    const user = await getUserById(registrationData.userId);

    if (!user) {
      console.error("❌ User not found:", registrationData.userId);
      throw new Error("사용자 정보를 찾을 수 없습니다");
    }

    console.log("👤 User found:", user);

    const eventRef = doc(db, EVENTS_COLLECTION, registrationData.eventId);
    const incrementField = user.gender === "male" ? "maleCount" : "femaleCount";

    console.log(
      `📊 Will increment ${incrementField} for user gender: ${user.gender}`
    );

    // Get current event data first
    console.log("📖 Getting current event data...");
    const currentEventDoc = await getDoc(eventRef);

    if (!currentEventDoc.exists()) {
      console.error("❌ Event not found:", registrationData.eventId);
      throw new Error("이벤트를 찾을 수 없습니다");
    }

    const currentEventData = currentEventDoc.data();
    const currentParticipants = currentEventData?.participants || [];

    console.log("📋 Current event data:", {
      maleCount: currentEventData?.maleCount || 0,
      femaleCount: currentEventData?.femaleCount || 0,
      participants: currentParticipants,
    });

    // Check if user is already in participants to prevent duplicates
    if (currentParticipants.includes(user.id)) {
      console.log("⚠️ User already in participants list:", user.id);
      return registrationDoc.id;
    }

    console.log("💾 Updating event document...");
    await updateDoc(eventRef, {
      [incrementField]: increment(1),
      participants: [...currentParticipants, user.id],
      updatedAt: serverTimestamp(),
    });

    console.log(
      `✅ Event updated successfully: ${incrementField} +1, participant ${user.id} added`
    );

    return registrationDoc.id;
  } catch (error) {
    console.error("❌ Error creating registration:", error);
    throw error;
  }
};

export const getRegistrationByUser = async (
  userId: string,
  eventId: string
): Promise<Registration | null> => {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where("userId", "==", userId),
      where("eventId", "==", eventId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const regDoc = querySnapshot.docs[0];
      return { id: regDoc.id, ...regDoc.data() } as Registration;
    }
    return null;
  } catch (error) {
    console.error("Error getting registration:", error);
    throw error;
  }
};

export const updateRegistrationPayment = async (
  registrationId: string,
  paymentStatus: "completed" | "failed",
  paymentId?: string
) => {
  try {
    const regRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);
    await updateDoc(regRef, {
      paymentStatus,
      paymentId: paymentId || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

// Cancel registration and remove from event
export const cancelRegistration = async (userId: string, eventId: string) => {
  try {
    console.log("🚫 Starting registration cancellation...");
    console.log("- User ID:", userId);
    console.log("- Event ID:", eventId);

    // Get user info first for gender-based count update
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("사용자 정보를 찾을 수 없습니다");
    }

    // Find and delete the registration
    const registrationQuery = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where("userId", "==", userId),
      where("eventId", "==", eventId),
      limit(1)
    );
    const registrationSnapshot = await getDocs(registrationQuery);

    if (registrationSnapshot.empty) {
      throw new Error("등록 정보를 찾을 수 없습니다");
    }

    const registrationDoc = registrationSnapshot.docs[0];
    console.log("📝 Found registration:", registrationDoc.id);

    // Delete the registration document
    await deleteDoc(doc(db, REGISTRATIONS_COLLECTION, registrationDoc.id));
    console.log("✅ Registration deleted");

    // Update event counts and participants
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error("이벤트를 찾을 수 없습니다");
    }

    const eventData = eventDoc.data();
    const participants = eventData?.participants || [];

    // Remove user from participants array
    const updatedParticipants = participants.filter(
      (id: string) => id !== userId
    );

    // Determine which count to decrement
    const decrementField = user.gender === "male" ? "maleCount" : "femaleCount";

    console.log(
      `📊 Will decrement ${decrementField} for user gender: ${user.gender}`
    );
    console.log("👥 Removing user from participants list");

    // Update event document
    await updateDoc(eventRef, {
      [decrementField]: increment(-1),
      participants: updatedParticipants,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Event updated: participant removed and count decremented");

    // Delete questionnaire answers if they exist
    console.log("🗑️ Looking for questionnaire answers to delete...");
    const questionnaireQuery = query(
      collection(db, "questionnaire_answers"),
      where("userId", "==", userId),
      where("eventId", "==", eventId),
      limit(1)
    );
    const questionnaireSnapshot = await getDocs(questionnaireQuery);

    if (!questionnaireSnapshot.empty) {
      const questionnaireDoc = questionnaireSnapshot.docs[0];
      await deleteDoc(doc(db, "questionnaire_answers", questionnaireDoc.id));
      console.log("🗑️ Questionnaire answers deleted");
    } else {
      console.log("ℹ️ No questionnaire answers found to delete");
    }

    // Delete the user document from users collection
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    console.log("🗑️ User document deleted from users collection");

    console.log("🎉 Registration cancellation completed successfully");
  } catch (error) {
    console.error("❌ Error cancelling registration:", error);
    throw error;
  }
};

// Menu operations
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const menuQuery = query(
      collection(db, "menu"),
      orderBy("name")
    );
    const querySnapshot = await getDocs(menuQuery);

    const menuItems: MenuItem[] = [];
    querySnapshot.forEach((doc) => {
      menuItems.push({
        id: doc.id,
        ...doc.data()
      } as MenuItem);
    });

    return menuItems;
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
};

export const createMenuItem = async (name: string) => {
  try {
    const menuDoc = await addDoc(collection(db, "menu"), {
      name,
      createdAt: serverTimestamp(),
    });
    return menuDoc.id;
  } catch (error) {
    console.error("Error creating menu item:", error);
    throw error;
  }
};

// Questionnaire operations
export const getQuestions = async (): Promise<Question[]> => {
  try {
    const questionsQuery = query(
      collection(db, "questions"),
      orderBy("order")
    );
    const querySnapshot = await getDocs(questionsQuery);

    const questions: Question[] = [];
    querySnapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      } as Question);
    });

    return questions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};

export const createQuestion = async (questionData: Omit<Question, "id">) => {
  try {
    const questionDoc = await addDoc(collection(db, "questions"), {
      ...questionData,
      createdAt: serverTimestamp(),
    });
    return questionDoc.id;
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

export const saveQuestionnaireAnswers = async (
  userId: string,
  eventId: string,
  answers: QuestionnaireAnswers
) => {
  try {
    // Get questions to structure the data properly
    const questions = await getQuestions();

    // Structure answers with question details for better organization
    const structuredAnswers = questions.map(question => ({
      questionId: question.id,
      order: question.order,
      title: question.title,
      subtitle: question.subtitle,
      answer: answers[question.id] || ""
    }));

    // Check if answers already exist
    const existingQuery = query(
      collection(db, "questionnaire_answers"),
      where("userId", "==", userId),
      where("eventId", "==", eventId),
      limit(1)
    );
    const existingSnapshot = await getDocs(existingQuery);

    const questionnaireData = {
      userId,
      eventId,
      answers: structuredAnswers,
      totalQuestions: questions.length,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnapshot.empty) {
      // Update existing answers
      const docRef = existingSnapshot.docs[0].ref;
      await updateDoc(docRef, questionnaireData);
      return existingSnapshot.docs[0].id;
    } else {
      // Create new answers document
      const answersDoc = await addDoc(collection(db, "questionnaire_answers"), questionnaireData);
      return answersDoc.id;
    }
  } catch (error) {
    console.error("Error saving questionnaire answers:", error);
    throw error;
  }
};

export const getQuestionnaireAnswers = async (
  userId: string,
  eventId: string
): Promise<QuestionnaireAnswers | null> => {
  try {
    const answersQuery = query(
      collection(db, "questionnaire_answers"),
      where("userId", "==", userId),
      where("eventId", "==", eventId),
      limit(1)
    );
    const querySnapshot = await getDocs(answersQuery);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();

      // Convert structured answers back to simple QuestionnaireAnswers format
      const answers: QuestionnaireAnswers = {};
      if (data.answers && Array.isArray(data.answers)) {
        data.answers.forEach((item: any) => {
          if (item.questionId && item.answer) {
            answers[item.questionId] = item.answer;
          }
        });
      }

      return answers;
    }

    return null;
  } catch (error) {
    console.error("Error fetching questionnaire answers:", error);
    return null;
  }
};

export const getAllQuestionnaireAnswers = async (eventId: string) => {
  try {
    const answersQuery = query(
      collection(db, "questionnaire_answers"),
      where("eventId", "==", eventId)
    );
    const querySnapshot = await getDocs(answersQuery);

    const allAnswers = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();

      // Get user info
      const user = await getUserById(data.userId);

      allAnswers.push({
        id: doc.id,
        userId: data.userId,
        userName: user?.name || "Unknown",
        userGender: user?.gender || "unknown",
        userAge: user?.age || 0,
        answers: data.answers || [],
        totalQuestions: data.totalQuestions || 0,
        completedAt: data.completedAt,
        updatedAt: data.updatedAt,
      });
    }

    return allAnswers;
  } catch (error) {
    console.error("Error fetching all questionnaire answers:", error);
    return [];
  }
};

// Utility function to check bar password
export const verifyBarPassword = (inputPassword: string): boolean => {
  const correctPassword =
    process.env.NEXT_PUBLIC_BAR_PASSWORD || "kyareureuk2024";
  return inputPassword === correctPassword;
};
