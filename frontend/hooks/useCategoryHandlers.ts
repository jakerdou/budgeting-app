import { useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  allocated: number;
  available: number;
  goal_amount?: number;
  [key: string]: any;
}

interface UseCategoryHandlersProps {
  fetchAllocatedAndSpent: () => Promise<void>;
  selectedInfoCategory: Category | null;
  setSelectedInfoCategory: React.Dispatch<React.SetStateAction<Category | null>>;
}

interface UseCategoryHandlersReturn {
  handleCategoryNameUpdate: (categoryId: string, newName: string) => void;
  handleCategoryGoalUpdate: (categoryId: string, goalAmount: number | null) => void;
}

export function useCategoryHandlers({
  fetchAllocatedAndSpent,
  selectedInfoCategory,
  setSelectedInfoCategory,
}: UseCategoryHandlersProps): UseCategoryHandlersReturn {
  
  const handleCategoryNameUpdate = useCallback((categoryId: string, newName: string) => {
    // This will trigger a re-render of the categories from the context
    // The useCategories hook should automatically refresh the categories
    fetchAllocatedAndSpent();
  }, [fetchAllocatedAndSpent]);

  const handleCategoryGoalUpdate = useCallback((categoryId: string, goalAmount: number | null) => {
    // Update the selected category's goal amount immediately
    if (selectedInfoCategory && selectedInfoCategory.id === categoryId) {
      setSelectedInfoCategory({
        ...selectedInfoCategory,
        goal_amount: goalAmount || undefined
      });
    }
    // Also refresh the categories to ensure everything is in sync
    fetchAllocatedAndSpent();
  }, [selectedInfoCategory, setSelectedInfoCategory, fetchAllocatedAndSpent]);

  return {
    handleCategoryNameUpdate,
    handleCategoryGoalUpdate,
  };
}
