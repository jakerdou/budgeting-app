import { useState, useEffect } from 'react';
import {
  setMonthlyDates,
  setBiWeeklyDates,
  setYearlyDates,
} from '@/utils/dateUtils';

interface User {
  email: string;
  uid: string;
  preferences?: {
    budget_period?: string;
    pay_schedule?: any;
  };
}

interface UseBudgetPeriodReturn {
  startDate: string;
  endDate: string;
  budgetPeriod: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setBudgetPeriod: (period: string) => void;
}

export function useBudgetPeriod(user: User | null): UseBudgetPeriodReturn {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState(user?.preferences?.budget_period || 'monthly');

  useEffect(() => {
    if (budgetPeriod === 'monthly') {
      setMonthlyDates(setStartDate, setEndDate);
    } else if (budgetPeriod === 'bi-weekly') {
      setBiWeeklyDates(user?.preferences?.pay_schedule || {}, setStartDate, setEndDate);
    } else if (budgetPeriod === 'yearly') {
      setYearlyDates(setStartDate, setEndDate);
    }
  }, [budgetPeriod, user]);

  return {
    startDate,
    endDate,
    budgetPeriod,
    setStartDate,
    setEndDate,
    setBudgetPeriod,
  };
}
