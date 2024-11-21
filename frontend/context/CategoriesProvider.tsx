// CategoriesProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '@/context/AuthProvider';

type Category = {
  id: string;
  name: string;
  allocated: number;
  available: number;
  // add other category fields if needed
};

type CategoriesContextType = {
  categories: Category[];
  loading: boolean;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Create a query to get categories for the current user
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('user_id', '==', user.uid)
    );

    // Subscribe to Firestore updates
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const fetchedCategories: Category[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Category));
      console.log('fetched Categories');

      setCategories(fetchedCategories);
      setLoading(false);
    });

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [user]);

  return (
    <CategoriesContext.Provider value={{ categories, loading }}>
      {children}
    </CategoriesContext.Provider>
  );
};

// Custom hook to use categories context
export const useCategories = (): CategoriesContextType => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};
