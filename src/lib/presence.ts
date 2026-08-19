import { ref, set, onDisconnect, onValue } from "firebase/database";
import { rtdb } from "./firebase";

// set presence for current user (call on signin/client)
export function setMyPresence(uid: string) {
  if (!uid) return;
  try {
    const statusRef = ref(rtdb, `status/${uid}`);
    // set online
    set(statusRef, { state: "online", last_changed: Date.now() });
    // ensure offline on disconnect
    onDisconnect(statusRef).set({ state: "offline", last_changed: Date.now() });
  } catch (err) {
    console.error("presence:setMyPresence", err);
  }
}

export function clearMyPresence(uid: string) {
  if (!uid) return;
  try {
    const statusRef = ref(rtdb, `status/${uid}`);
    set(statusRef, { state: "offline", last_changed: Date.now() });
  } catch (err) {
    console.error("presence:clearMyPresence", err);
  }
}

export function subscribeToPresence(uid: string, cb: (state: { state: string; last_changed?: number } | null) => void) {
  if (!uid) return () => {};
  const statusRef = ref(rtdb, `status/${uid}`);
  const unsub = onValue(statusRef, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb(snap.val());
  });
  return () => unsub();
}
