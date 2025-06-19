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
  is_unallocated_funds?: boolean;
  // add other category fields if needed
};

type CategoriesContextType = {
  categories: Category[];
  loading: boolean;
  unallocatedFunds: Category | null;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [unallocatedFunds, setUnallocatedFunds] = useState<Category | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create a query to get categories for the current user
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('user_id', '==', user.uid)
    );    // Subscribe to Firestore updates
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const fetchedCategories: Category[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Category));
        // Sort categories: Unallocated Funds at top, rest alphabetically
      const sortedCategories = [...fetchedCategories].sort((a, b) => {
        // Always put Unallocated Funds at the top
        if (a.is_unallocated_funds) return -1;
        if (b.is_unallocated_funds) return 1;
        
        // Otherwise sort alphabetically by name
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      
      // console.log('Fetched categories:', sortedCategories);
      setCategories(sortedCategories);
      
      // Find the unallocated funds category
      const unallocated = fetchedCategories.find(category => category.is_unallocated_funds) || null;
      setUnallocatedFunds(unallocated);
      
      setLoading(false);
    });

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [user]);

  return (
    <CategoriesContext.Provider value={{ categories, loading, unallocatedFunds }}>
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
