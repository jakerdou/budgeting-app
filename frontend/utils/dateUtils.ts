// src/utils/dateUtils.ts

import { startOfMonth, endOfMonth, subDays, subMonths, subYears, addDays, addMonths, addYears, startOfDay, startOfYear, endOfYear } from 'date-fns';

export const setMonthlyDates = (setStartDate: (date: Date) => void, setEndDate: (date: Date) => void) => {
  // const startOfMonthUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1, 0, 0, 0));
  // const endOfMonthUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0, 23, 59, 59));
  // console.log('setMonthlyDates', startOfMonthUTC, endOfMonthUTC);

  // setStartDate(startOfMonthUTC);
  // setEndDate(endOfMonthUTC);
  setStartDate(startOfMonth(new Date()));
  setEndDate(endOfMonth(new Date()));
  // console.log('setMonthlyDates', startOfMonth(new Date()), endOfMonth(new Date()));
};


export const setBiWeeklyDates = (
  userPreferences: { start_date: string | null },
  setStartDate: (date: Date) => void,
  setEndDate: (date: Date) => void
) => {
  if (userPreferences?.start_date) {
    const payStartDate = new Date(userPreferences.start_date);
    const currentDate = startOfDay(new Date());
    let periodStartDate = payStartDate;

    while (periodStartDate <= currentDate) {
      periodStartDate = addDays(periodStartDate, 14);
    }
    periodStartDate = addDays(periodStartDate, -14);

    setStartDate(periodStartDate);
    setEndDate(addDays(periodStartDate, 13));
  }
};

export const setYearlyDates = (setStartDate: (date: Date) => void, setEndDate: (date: Date) => void) => {
  setStartDate(startOfYear(new Date()));
  setEndDate(endOfYear(new Date()));
};

export const setPreviousBudgetPeriodTimeFrame = (
  budgetPeriod: string,
  currentStartDate: Date,
  currentEndDate: Date,
  setStartDate: (date: Date) => void,
  setEndDate: (date: Date) => void
) => {
  if (budgetPeriod === 'monthly') {
    setStartDate(subMonths(currentStartDate, 1));
    setEndDate(endOfMonth(subMonths(currentEndDate, 1)));
    // setEndDate(new Date(Date.UTC(subMonths(currentEndDate, 1).getUTCFullYear(), subMonths(currentEndDate, 1).getUTCMonth() + 1, 0, 23, 59, 59)));
  } else if (budgetPeriod === 'bi-weekly') {
    setStartDate(subDays(currentStartDate, 14));
    setEndDate(subDays(currentEndDate, 14));
  } else if (budgetPeriod === 'yearly') {
    setStartDate(subYears(currentStartDate, 1));
    setEndDate(subYears(currentEndDate, 1));
  }
};

export const setNextBudgetPeriodTimeFrame = (
  budgetPeriod: string,
  currentStartDate: Date,
  currentEndDate: Date,
  setStartDate: (date: Date) => void,
  setEndDate: (date: Date) => void
) => {
  if (budgetPeriod === 'monthly') {
    setStartDate(addMonths(currentStartDate, 1));
    setEndDate(endOfMonth(addMonths(currentStartDate, 1)));
    // setEndDate(new Date(Date.UTC(addMonths(currentEndDate, 1).getUTCFullYear(), addMonths(currentEndDate, 1).getUTCMonth() + 1, 0, 23, 59, 59)));
    

  } else if (budgetPeriod === 'bi-weekly') {
    setStartDate(addDays(currentStartDate, 14));
    setEndDate(addDays(currentEndDate, 14));
  } else if (budgetPeriod === 'yearly') {
    setStartDate(addYears(currentStartDate, 1));
    setEndDate(addYears(currentEndDate, 1));
  }
};
