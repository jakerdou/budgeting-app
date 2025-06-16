// app/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore'; // Assuming Firestore is used
import { db } from '../firebaseConfig'; // Import your Firestore instance

type AuthContextType = {
  user: { email: string; uid: string; preferences?: any } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUserPreferences: (newPreferences: any) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; uid: string; preferences?: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch preferences
        try {
          const userRef = doc(db, 'users', firebaseUser.uid); // Fetch document by UID
          const userSnap = await getDoc(userRef);
          let preferences = userSnap.exists() ? userSnap.data().preferences : {};

          setUser({
            email: firebaseUser.email!,
            uid: firebaseUser.uid,
            preferences, // Add preferences to user object
          });
        } catch (error) {
          console.error('Failed to fetch user preferences:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateUserPreferences = (newPreferences: any) => {
    setUser((prevUser) => {
      if (prevUser) {
        return { ...prevUser, preferences: newPreferences };
      }
      return prevUser;
    });
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_USER_PREFIX}/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          user_id: firebaseUser.uid,
        }),
      });
    } catch (error) {
      console.error("Signup failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUserPreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
