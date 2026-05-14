import { useState, useEffect } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Ensure user document exists unconditionally whenever they log in
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              createdAt: serverTimestamp(),
              lastActiveAt: serverTimestamp(),
            });
          } else {
            await setDoc(userRef, {
               uid: u.uid,
               email: u.email,
               displayName: u.displayName,
               createdAt: snap.data().createdAt,
               lastActiveAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (e) {
          console.error("Failed to sync user doc:", e);
        }
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert('Login failed');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, login, logout };
}
