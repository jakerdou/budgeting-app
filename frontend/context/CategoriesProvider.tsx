// CategoriesProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig.env';
import { useAuth } from '@/context/AuthProvider';

type Category = {
  id: string;
  name: string;
  allocated: number;
  available: number;
  is_unallocated_funds?: boolean;
  group_id?: string;
  // add other category fields if needed
};

type CategoryGroup = {
  id: string;
  name: string;
  user_id: string;
  sort_order: number;
  created_at: string;
};

type CategoriesContextType = {
  categories: Category[];
  categoryGroups: CategoryGroup[];
  loading: boolean;
  groupsLoading: boolean;
  unallocatedFunds: Category | null;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [unallocatedFunds, setUnallocatedFunds] = useState<Category | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create a query to get categories for the current user
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('user_id', '==', user.uid)
    );

    // Subscribe to Firestore updates for categories
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
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
      
      setCategories(sortedCategories);
      
      // Find the unallocated funds category
      const unallocated = fetchedCategories.find(category => category.is_unallocated_funds) || null;
      setUnallocatedFunds(unallocated);
      
      setLoading(false);
    });

    // Create a query to get category groups for the current user
    const categoryGroupsQuery = query(
      collection(db, 'category_groups'),
      where('user_id', '==', user.uid)
    );

    // Subscribe to Firestore updates for category groups
    const unsubscribeCategoryGroups = onSnapshot(categoryGroupsQuery, (snapshot) => {
      const fetchedCategoryGroups: CategoryGroup[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as CategoryGroup));

      // Sort category groups by sort_order, then by name
      const sortedCategoryGroups = [...fetchedCategoryGroups].sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      
      setCategoryGroups(sortedCategoryGroups);
      setGroupsLoading(false);
    });

    // Clean up the listeners when component unmounts
    return () => {
      unsubscribeCategories();
      unsubscribeCategoryGroups();
    };
  }, [user]);

  return (
    <CategoriesContext.Provider value={{ categories, categoryGroups, loading, groupsLoading, unallocatedFunds }}>
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
