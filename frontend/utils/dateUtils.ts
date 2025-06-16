// src/utils/dateUtils.ts

import { startOfMonth, endOfMonth, subDays, subMonths, subYears, addDays, addMonths, addYears, startOfDay, startOfYear, endOfYear } from 'date-fns';

/**
 * Formats a Date object to YYYY-MM-DD string format for backend API calls
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const setMonthlyDates = (setStartDate: (date: string) => void, setEndDate: (date: string) => void) => {
  setStartDate(formatDateToYYYYMMDD(startOfMonth(new Date())));
  setEndDate(formatDateToYYYYMMDD(endOfMonth(new Date())));
};


export const setBiWeeklyDates = (
  userPreferences: { start_date: string | null },
  setStartDate: (date: string) => void,
  setEndDate: (date: string) => void
) => {
  if (userPreferences?.start_date) {
    console.log('Setting bi-weekly dates based on user preferences:', userPreferences.start_date);
    
    // Ensure we have a valid date format
    let payStartDateStr = userPreferences.start_date;
    if (typeof payStartDateStr !== 'string') {
      console.error('Invalid start_date format:', payStartDateStr);
      return;
    }
    
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = payStartDateStr.split('-').map(Number);
    const payStartDate = new Date(year, month - 1, day);
    
    // Get timezone-aware start of day for current date
    const currentDate = startOfDay(new Date());
    
    let periodStartDate = new Date(payStartDate);

    // Calculate the most recent pay period
    while (periodStartDate <= currentDate) {
      periodStartDate = addDays(periodStartDate, 14);
    }
    periodStartDate = addDays(periodStartDate, -14);    console.log('Calculated period start date:', formatDateToYYYYMMDD(periodStartDate), 'ISO string:', periodStartDate.toISOString());
    
    setStartDate(formatDateToYYYYMMDD(periodStartDate));
    setEndDate(formatDateToYYYYMMDD(addDays(periodStartDate, 13)));
  }
};

export const setYearlyDates = (setStartDate: (date: string) => void, setEndDate: (date: string) => void) => {
  setStartDate(formatDateToYYYYMMDD(startOfYear(new Date())));
  setEndDate(formatDateToYYYYMMDD(endOfYear(new Date())));
};

export const setPreviousBudgetPeriodTimeFrame = (
  budgetPeriod: string,
  currentStartDate: string,
  currentEndDate: string,
  setStartDate: (date: string) => void,
  setEndDate: (date: string) => void
) => {
  const [startYear, startMonth, startDay] = currentStartDate.split('-').map(Number);
  const startDateObj = new Date(startYear, startMonth - 1, startDay);
  const [endYear, endMonth, endDay] = currentEndDate.split('-').map(Number);
  const endDateObj = new Date(endYear, endMonth - 1, endDay);
  
  if (budgetPeriod === 'monthly') {
    setStartDate(formatDateToYYYYMMDD(subMonths(startDateObj, 1)));
    setEndDate(formatDateToYYYYMMDD(endOfMonth(subMonths(endDateObj, 1))));
    // setEndDate(new Date(Date.UTC(subMonths(currentEndDate, 1).getUTCFullYear(), subMonths(currentEndDate, 1).getUTCMonth() + 1, 0, 23, 59, 59)));
  } else if (budgetPeriod === 'bi-weekly') {
    setStartDate(formatDateToYYYYMMDD(subDays(startDateObj, 14)));
    setEndDate(formatDateToYYYYMMDD(subDays(endDateObj, 14)));
  } else if (budgetPeriod === 'yearly') {
    setStartDate(formatDateToYYYYMMDD(subYears(startDateObj, 1)));
    setEndDate(formatDateToYYYYMMDD(subYears(endDateObj, 1)));
  }
};

export const setNextBudgetPeriodTimeFrame = (
  budgetPeriod: string,
  currentStartDate: string,
  currentEndDate: string,
  setStartDate: (date: string) => void,
  setEndDate: (date: string) => void
) => {
  // Convert string dates to Date objects for calculations
  const [startYear, startMonth, startDay] = currentStartDate.split('-').map(Number);
  const startDateObj = new Date(startYear, startMonth - 1, startDay);
  const [endYear, endMonth, endDay] = currentEndDate.split('-').map(Number);
  const endDateObj = new Date(endYear, endMonth - 1, endDay);
  
  if (budgetPeriod === 'monthly') {
    setStartDate(formatDateToYYYYMMDD(addMonths(startDateObj, 1)));
    setEndDate(formatDateToYYYYMMDD(endOfMonth(addMonths(startDateObj, 1))));
    // setEndDate(new Date(Date.UTC(addMonths(currentEndDate, 1).getUTCFullYear(), addMonths(currentEndDate, 1).getUTCMonth() + 1, 0, 23, 59, 59)));
  } else if (budgetPeriod === 'bi-weekly') {
    setStartDate(formatDateToYYYYMMDD(addDays(startDateObj, 14)));
    setEndDate(formatDateToYYYYMMDD(addDays(endDateObj, 14)));
  } else if (budgetPeriod === 'yearly') {
    setStartDate(formatDateToYYYYMMDD(addYears(startDateObj, 1)));
    setEndDate(formatDateToYYYYMMDD(addYears(endDateObj, 1)));
  }
};
