"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { setMyPresence, clearMyPresence } from "@/lib/presence";
import { UserProfile, UserRole } from "@/types";

// Local-only escape hatch for viewing pages without a real Firebase backend.
// Set NEXT_PUBLIC_PREVIEW_MODE=true in .env.local (never commit it) to sign
// in as a fake user automatically. Leave unset/false for real behavior.
const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";
const PREVIEW_ROLE = (process.env.NEXT_PUBLIC_PREVIEW_ROLE as UserRole) || "admin";

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
  const idleTimerRef = useRef<number | null>(null);

  const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  const LAST_ACTIVITY_KEY = "unievents_lastActivity";
  const LAST_VISIT_KEY = "unievents_lastVisitDate";

  const getToday = () => new Date().toISOString().slice(0, 10);

  const clearIdleTimer = () => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const resetActivity = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.setItem(LAST_VISIT_KEY, getToday());
    } catch (e) {}
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
      setProfile(null);
      setUser(null);
    }, IDLE_TIMEOUT) as unknown as number;
  };

  const setupActivityListeners = () => {
    if (typeof window === "undefined") return;
    const events = ["mousemove", "keydown", "click", "touchstart", "visibilitychange"];
    const handler = () => resetActivity();
    events.forEach((ev) => document.addEventListener(ev, handler));
    // Initialize activity timestamp and timer
    resetActivity();
    return () => {
      clearIdleTimer();
      events.forEach((ev) => document.removeEventListener(ev, handler));
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (PREVIEW_MODE) {
      const previewProfile: UserProfile = {
        uid: "preview-user",
        email: "preview@university.ac.zw",
        displayName: "Preview User",
        role: PREVIEW_ROLE,
        studentId: "P000000",
        isActive: true,
        createdAt: Timestamp.now(),
      };
      setUser({ uid: "preview-user", email: previewProfile.email } as unknown as User);
      setProfile(previewProfile);
      setLoading(false);
      return;
    }

    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If running client-side, check last activity/visit and expire session if needed
      if (firebaseUser && typeof window !== "undefined") {
        try {
          const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
          const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
          const now = Date.now();
          const expiredByIdle = lastActivity > 0 && now - lastActivity > IDLE_TIMEOUT;
          const differentDay = lastVisit && lastVisit !== getToday();
          if (expiredByIdle || differentDay) {
            await signOut(auth);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }
        // set realtime presence
        try {
          setMyPresence(firebaseUser.uid);
          (window as any).__unievents_currentUid = firebaseUser.uid;
          const handleVisibility = () => {
            if (document.visibilityState === 'visible') setMyPresence(firebaseUser.uid);
            else clearMyPresence(firebaseUser.uid);
          };
          document.addEventListener('visibilitychange', handleVisibility);
          (window as any).__unievents_presenceCleanup = () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            clearMyPresence(firebaseUser.uid);
          };
        } catch (e) {
          console.error('presence init', e);
        }
        // start activity listeners when signed in
        const cleanup = setupActivityListeners();
        // attach cleanup to unload
        (window as any).__unievents_cleanupAuthListeners = cleanup;
      } else {
        setProfile(null);
          try {
            // clear presence on sign out
            const cur = (window as any).__unievents_currentUid;
            if (cur) clearMyPresence(cur);
            (window as any).__unievents_currentUid = null;
          } catch (e) {}
        // clear stored activity on sign out
        try {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          localStorage.removeItem(LAST_VISIT_KEY);
        } catch (e) {}
        // cleanup listeners if present
        try {
          const cl = (window as any).__unievents_cleanupAuthListeners;
          if (cl) cl();
          (window as any).__unievents_cleanupAuthListeners = null;
        } catch (e) {}
        try {
          const pcl = (window as any).__unievents_presenceCleanup;
          if (pcl) pcl();
          (window as any).__unievents_presenceCleanup = null;
        } catch (e) {}
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      // cleanup listeners when provider unmounts
      try {
        const cl = (window as any).__unievents_cleanupAuthListeners;
        if (cl) cl();
      } catch (e) {}
      try {
        const pcl = (window as any).__unievents_presenceCleanup;
        if (pcl) pcl();
      } catch (e) {}
    };
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
    // initialize activity timestamps on sign in
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        localStorage.setItem(LAST_VISIT_KEY, getToday());
      } catch (e) {}
    }
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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        localStorage.setItem(LAST_VISIT_KEY, getToday());
      } catch (e) {}
    }
  };

  const logout = async () => {
    if (PREVIEW_MODE) {
      setUser(null);
      setProfile(null);
      return;
    }
    await signOut(auth);
    setProfile(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(LAST_VISIT_KEY);
      } catch (e) {}
    }
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
