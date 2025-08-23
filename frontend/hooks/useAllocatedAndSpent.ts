import { useState, useEffect, useCallback } from 'react';
import { getAllocatedAndSpent } from '@/services/categories';

interface User {
  email: string;
  uid: string;
  preferences?: {
    budget_period?: string;
    pay_schedule?: any;
  };
}

interface AllocatedAndSpentData {
  [categoryId: string]: {
    allocated: number;
    spent: number;
  };
}

interface UseAllocatedAndSpentReturn {
  allocatedAndSpent: AllocatedAndSpentData;
  unallocatedIncome: number;
  loading: boolean;
  fetchAllocatedAndSpent: () => Promise<void>;
  getAllocatedAmount: (categoryId: string) => number;
  getSpentAmount: (categoryId: string) => number;
  setAllocatedAndSpent: React.Dispatch<React.SetStateAction<AllocatedAndSpentData>>;
  setUnallocatedIncome: React.Dispatch<React.SetStateAction<number>>;
}

export function useAllocatedAndSpent(
  user: User | null,
  startDate: string,
  endDate: string
): UseAllocatedAndSpentReturn {
  const [allocatedAndSpent, setAllocatedAndSpent] = useState<AllocatedAndSpentData>({});
  const [unallocatedIncome, setUnallocatedIncome] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchAllocatedAndSpent = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await getAllocatedAndSpent(user.uid, startDate, endDate);

        // Transform the array response into an object keyed by category_id
        const transformedData: AllocatedAndSpentData = {};
        data.allocated_and_spent?.forEach((item: any) => {
          transformedData[item.category_id] = {
            allocated: item.allocated,
            spent: item.spent
          };
        });

        setAllocatedAndSpent(transformedData);
        setUnallocatedIncome(data.unallocated_income || 0);
      } catch (error) {
        console.error('Failed to fetch allocated and spent data', error);
      } finally {
        setLoading(false);
      }
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllocatedAndSpent();
    }
  }, [fetchAllocatedAndSpent]);

  const getAllocatedAmount = (categoryId: string) => {
    return allocatedAndSpent[categoryId]?.allocated || 0;
  };

  const getSpentAmount = (categoryId: string) => {
    return allocatedAndSpent[categoryId]?.spent || 0;
  };

  return {
    allocatedAndSpent,
    unallocatedIncome,
    loading,
    fetchAllocatedAndSpent,
    getAllocatedAmount,
    getSpentAmount,
    setAllocatedAndSpent,
    setUnallocatedIncome,
  };
}
