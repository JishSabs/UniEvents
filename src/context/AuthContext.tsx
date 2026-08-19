"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    studentId: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase is not initialized. Check your environment configuration.");
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profileDoc = await getDoc(doc(db, "users", cred.user.uid));

    if (!profileDoc.exists()) {
      await signOut(auth);
      throw new Error("No user profile found. Please contact support.");
    }

    const profileData = profileDoc.data() as UserProfile;
    if (!profileData.isActive) {
      await signOut(auth);
      throw new Error("account-disabled");
    }

    setUser(cred.user);
    setProfile(profileData);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    studentId: string
  ) => {
    const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
    if (
      allowedDomain &&
      !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)
    ) {
      throw new Error("invalid-email-domain");
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const newProfile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
      uid: cred.user.uid,
      email,
      displayName,
      role: "student" as UserRole,
      studentId,
      isActive: true,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", cred.user.uid), newProfile);
    setProfile(newProfile as UserProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const isAdmin = profile?.role === "admin";
  const isModerator = profile?.role === "moderator" || isAdmin;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, logout, isAdmin, isModerator }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
