
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { ChatMessage, AgendaItem, UserContext } from "../types";

// --- Configuration provided by user ---
const firebaseConfig = {
  apiKey: "AIzaSyAqwuPe4uAIiGORR2OxnHzInVRUtP4KIN8",
  authDomain: "talwit-f6560.firebaseapp.com",
  projectId: "talwit-f6560",
  storageBucket: "talwit-f6560.firebasestorage.app",
  messagingSenderId: "855464070502",
  appId: "1:855464070502:web:1bc73f239aef3eddd98ca7",
  measurementId: "G-M1LTFEMPM5"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);

// --- Export Auth & DB for usage in components ---
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Logic Function: Register User ---
export const registerUserLogic = async (user: any) => {
    try {
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "user",
            createdAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("Error creating user document: ", e);
        throw e;
    }
};

// --- Logic Function: Login Helper ---
export const loginUserLogic = () => {
    console.log("User logged in successfully");
};

// --- Chat History Functions ---

/**
 * Saves a message to the user's private chat history sub-collection.
 * Supports linking to an agenda item for cascading deletion.
 */
export const saveChatMessage = async (
  userId: string, 
  text: string, 
  sender: 'user' | 'model', 
  attachment?: string | null,
  linkedAgendaId?: string | null
) => {
  try {
    const chatRef = collection(db, "users", userId, "chatHistory");
    await addDoc(chatRef, {
      text: text,
      sender: sender, // mapped to 'role' in UI, but stored as 'sender' per requirement
      timestamp: serverTimestamp(),
      type: attachment ? "image" : "text", // Simple type detection
      attachment: attachment || null,
      linkedAgendaId: linkedAgendaId || null // Store the link if provided
    });
  } catch (error) {
    console.error("Error saving message:", error);
  }
};

/**
 * SMART DELETION: Deletes a user message and optionally the following AI response.
 * CASCADING DELETE: If the AI message is linked to an Agenda Item, delete that item too.
 * Uses a Batch Write to ensure atomicity.
 */
export const deleteChatPair = async (userId: string, userMessageId: string, aiMessageId?: string) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Delete User Message
    const userMsgRef = doc(db, "users", userId, "chatHistory", userMessageId);
    batch.delete(userMsgRef);

    // 2. Handle AI Response (Cascading Logic)
    if (aiMessageId) {
      const aiMsgRef = doc(db, "users", userId, "chatHistory", aiMessageId);
      
      // Fetch first to check for links
      const aiSnap = await getDoc(aiMsgRef);
      
      if (aiSnap.exists()) {
          const data = aiSnap.data();
          
          // Check if this chat message created an Agenda Item
          if (data.linkedAgendaId) {
              const agendaRef = doc(db, "users", userId, "agenda", data.linkedAgendaId);
              // Add agenda deletion to batch (Firestore handles "delete if exists" gracefully in batches)
              batch.delete(agendaRef); 
              console.log(`Cascading delete queued for Agenda Item: ${data.linkedAgendaId}`);
          }
      }

      // Add AI message deletion to batch
      batch.delete(aiMsgRef);
    }

    await batch.commit();
    console.log(`Deleted message pair and related entities.`);
  } catch (error) {
    console.error("Error deleting chat pair:", error);
    throw error;
  }
};

/**
 * Subscribes to the user's chat history in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeToChatHistory = (userId: string, onUpdate: (messages: ChatMessage[]) => void) => {
  const chatRef = collection(db, "users", userId, "chatHistory");
  const q = query(chatRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to JS number (milliseconds)
      const timestamp = data.timestamp instanceof Timestamp 
        ? data.timestamp.toMillis() 
        : Date.now();

      return {
        id: doc.id,
        role: data.sender === 'user' ? 'user' : 'model',
        text: data.text,
        timestamp: timestamp,
        attachment: data.attachment
      };
    });
    onUpdate(messages);
  });
};

// --- User Preferences & Context (Survey) ---

/**
 * Saves the Onboarding/Survey data to Firestore using merge: true
 * This prevents overwriting critical auth data.
 */
export const saveUserPreferences = async (userId: string, preferences: Partial<UserContext>) => {
  try {
    const userRef = doc(db, "users", userId);
    // Store in a nested 'preferences' object or root fields depending on schema preference.
    // Here we store as root fields for easier access, but merge prevents data loss.
    await setDoc(userRef, { 
      preferences: preferences,
      lastUpdated: serverTimestamp() 
    }, { merge: true });
    console.log("Preferences saved to Firestore");
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

/**
 * Fetches the latest user preferences for AI Context Injection.
 */
export const getUserPreferences = async (userId: string): Promise<UserContext | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.preferences as UserContext;
    }
    return null;
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return null;
  }
};

// --- Agenda Functions (Smart Agenda) ---

/**
 * Adds an agenda item and returns the new Document ID.
 */
export const addAgendaItem = async (userId: string, item: Omit<AgendaItem, 'id'>): Promise<string | null> => {
  try {
    const agendaRef = collection(db, "users", userId, "agenda");
    // Ensure date is a Timestamp if passed as Date object or string
    const dateValue = item.date instanceof Date ? Timestamp.fromDate(item.date) : Timestamp.fromDate(new Date(item.date));
    
    const docRef = await addDoc(agendaRef, {
      ...item,
      date: dateValue,
      createdAt: serverTimestamp()
    });
    console.log("Agenda item added:", item.title);
    return docRef.id;
  } catch (error) {
    console.error("Error adding agenda item:", error);
    return null;
  }
};

export const subscribeToAgenda = (userId: string, onUpdate: (items: AgendaItem[]) => void) => {
  const agendaRef = collection(db, "users", userId, "agenda");
  // Order by date to show upcoming first
  const q = query(agendaRef, orderBy("date", "asc"));

  return onSnapshot(q, (snapshot) => {
    const items: AgendaItem[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        isCompleted: data.isCompleted
      };
    });
    onUpdate(items);
  });
};

export const toggleAgendaItem = async (userId: string, itemId: string, currentStatus: boolean) => {
  try {
    const itemRef = doc(db, "users", userId, "agenda", itemId);
    await updateDoc(itemRef, {
      isCompleted: !currentStatus
    });
  } catch (error) {
    console.error("Error toggling agenda item:", error);
  }
};

export const deleteAgendaItem = async (userId: string, itemId: string) => {
  try {
    const itemRef = doc(db, "users", userId, "agenda", itemId);
    await deleteDoc(itemRef);
    console.log("Agenda item deleted");
  } catch (error) {
    console.error("Error deleting agenda item:", error);
  }
};
