import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

export interface User {
  id: string;
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  pads: number;
  token: number;
  address: string;
  totalEarned: number;
  createdAt: Timestamp;
  lastActive: Timestamp;
}

export interface Meme {
  id: string;
  imageUrl: string;
  caption: string;
  creatorId: string;
  creator: {
    username: string;
    displayName: string;
    pfpUrl: string;
  };
  likes: number;
  rewardPool: number;
  promptId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string;
  memeId: string;
  userId: string;
  user: {
    username: string;
    displayName: string;
    pfpUrl: string;
  };
  text: string;
  createdAt: Timestamp;
}

export interface DailyPrompt {
  id: string;
  prompt: string;
  date: string; // YYYY-MM-DD format
  endsAt: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Vote {
  id: string;
  memeId: string;
  userId: string;
  createdAt: Timestamp;
}

class FirebaseService {
  // User operations
  async createUser(
    userData: Omit<User, "id" | "createdAt" | "lastActive">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "users"), {
      ...userData,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
    return docRef.id;
  }

  async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  async getUserByFid(fid: number): Promise<User | null> {
    const q = query(collection(db, "users"), where("fid", "==", fid), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...updates,
      lastActive: serverTimestamp(),
    });
  }

  async updateUserPads(userId: string, padChange: number): Promise<void> {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      pads: increment(padChange),
      lastActive: serverTimestamp(),
    });
  }

  async updateUserTokens(userId: string, token: number): Promise<void> {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      token: increment(token),
      lastActive: serverTimestamp(),
    });
  }

  async getPads(userId: string) {
    try {
      const docRef = doc(db, "users", userId);
      const userSnap = await getDoc(docRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.pads || 0;
      } else {
        console.log("No such user!");
        return [];
      }
    } catch (error) {
      console.error("Error fetching user pads:", error);
      return [];
    }
  }

  // Daily Prompt operations
  async getTodayPrompt(): Promise<DailyPrompt | null> {
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, "dailyPrompts"),
      where("date", "==", today),
      where("isActive", "==", true),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as DailyPrompt;
    }
    return null;
  }

  async createDailyPrompt(prompt: string): Promise<string> {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const docRef = await addDoc(collection(db, "dailyPrompts"), {
      prompt,
      date: today,
      endsAt: Timestamp.fromDate(tomorrow),
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // Meme operations
  async uploadMemeImage(file: File, userId: string): Promise<string> {
    const fileName = `memes/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  async createMeme(
    memeData: Omit<Meme, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "memes"), {
      ...memeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getLastSubmissionDate(userId: string): Promise<string | null> {
    if (!userId) return null;

    try {
      const q = query(
        collection(db, "memes"),
        where("creatorId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const timestamp = data.createdAt;

      if (!timestamp) {
        return null;
      }

      // Handle Firestore Timestamp → ISO string
      if (timestamp.toDate) {
        return timestamp.toDate().toISOString();
      }

      // Fallback: if already a string
      if (typeof timestamp === "string") {
        return timestamp;
      }

      // Invalid format
      console.warn("Invalid createdAt format:", timestamp);
      return null;
    } catch (error) {
      console.error("Error fetching last submission date:", error);
      throw error; // or return null depending on your error strategy
    }
  }

  async getMemesByPrompt(promptId: string): Promise<Meme[]> {
    const q = query(
      collection(db, "memes"),
      where("promptId", "==", promptId),
      orderBy("likes", "desc"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Meme[];
  }

  async getMeme(memeId: string): Promise<Meme | null> {
    const docRef = doc(db, "memes", memeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Meme;
    }
    return null;
  }

  // Voting operations
  async voteMeme(memeId: string, userId: string): Promise<boolean> {
    try {
      // Check if user already voted
      // const voteQuery = query(
      //   collection(db, "votes"),
      //   where("memeId", "==", memeId),
      //   where("userId", "==", userId)
      // );
      // const existingVote = await getDocs(voteQuery);

      // if (!existingVote.empty) {
      //   return false; // Already voted
      // }

      // Create vote record
      await addDoc(collection(db, "votes"), {
        memeId,
        userId,
        createdAt: serverTimestamp(),
      });

      // Update meme likes and reward pool
      const memeRef = doc(db, "memes", memeId);
      await updateDoc(memeRef, {
        likes: increment(1),
        rewardPool: increment(10 * 0.6), // 60% of each vote goes to reward pool
        updatedAt: serverTimestamp(),
      });
      const meme = await getDoc(memeRef);

      // Decrease user pads
      await this.updateUserTokens(meme.data()?.creatorId, 10 * 0.6);
      await this.updateUserPads(userId, -3);

      return true;
    } catch (error) {
      console.error("Error voting on meme:", error);
      return false;
    }
  }

  async hasUserSharedMeme(userId: string, memeId: string): Promise<boolean> {
    const q = query(
      collection(db, "shares"),
      where("userId", "==", userId),
      where("memeId", "==", memeId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // ✅ Mark meme as shared (for reward tracking)
  async markMemeShared(userId: string, memeId: string) {
    const q = query(
      collection(db, "shares"),
      where("userId", "==", userId),
      where("memeId", "==", memeId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // ✅ Update existing record
      const shareDoc = querySnapshot.docs[0].ref;
      await updateDoc(shareDoc, {
        sharedAt: new Date(),
      });
    } else {
      // ✅ Create a new record if it doesn’t exist
      const newShareRef = doc(collection(db, "shares"));
      await setDoc(newShareRef, {
        userId,
        memeId,
        sharedAt: new Date(),
      });
    }
  }

  async hasUserVoted(memeId: string, userId: string): Promise<boolean> {
    const q = query(
      collection(db, "votes"),
      where("memeId", "==", memeId),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Comment operations
  async addComment(
    commentData: Omit<Comment, "id" | "createdAt">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "comments"), {
      ...commentData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getCommentsByMeme(memeId: string): Promise<Comment[]> {
    const q = query(
      collection(db, "comments"),
      where("memeId", "==", memeId),
      orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
  }

  // Real-time subscriptions
  subscribeToMemes(promptId: string, callback: (memes: Meme[]) => void) {
    const q = query(
      collection(db, "memes"),
      where("promptId", "==", promptId),
      orderBy("likes", "desc"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const memes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Meme[];
      callback(memes);
    });
  }

  subscribeToComments(memeId: string, callback: (comments: Comment[]) => void) {
    const q = query(
      collection(db, "comments"),
      where("memeId", "==", memeId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const comments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      callback(comments);
    });
  }

  // Utility functions
  async buyPads(userId: string, amount: number): Promise<void> {
    await this.updateUserPads(userId, amount);
  }

  async getUserSharesToday(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "shares"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      where("createdAt", "<=", Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }

  async rewardSharing(userId: string, memeId: string): Promise<boolean> {
    try {
      // Reward pads
      await this.updateUserPads(userId, 0.2);

      // // Log the share action
      await addDoc(collection(db, "shares"), {
        userId,
        memeId,
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (err) {
      console.error("Failed to reward sharing:", err);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
