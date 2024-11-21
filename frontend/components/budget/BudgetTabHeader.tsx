import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DatePickers from '@/components/budget/DatePickers';
import { Category } from '@/types';

interface BudgetTabHeaderProps {
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  userPreferences: any;
  setBudgetPeriod: (period: string) => void;
  budgetPeriod: string;
  setPreviousBudgetPeriodTimeFrame: (budgetPeriod: string, currentStartDate: Date, currentEndDate: Date, setStartDate: (date: Date) => void, setEndDate: (date: Date) => void) => void;
  setNextBudgetPeriodTimeFrame: (budgetPeriod: string, currentStartDate: Date, currentEndDate: Date, setStartDate: (date: Date) => void, setEndDate: (date: Date) => void) => void;
  unallocatedFunds: Category | null;
}

const BudgetTabHeader: React.FC<BudgetTabHeaderProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  userPreferences,
  setBudgetPeriod,
  budgetPeriod,
  setPreviousBudgetPeriodTimeFrame,
  setNextBudgetPeriodTimeFrame,
  unallocatedFunds,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.datePickersContainer}>
        <DatePickers
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          preferences={userPreferences}
          setBudgetPeriod={setBudgetPeriod}
          budgetPeriod={budgetPeriod}
          setPreviousBudgetPeriodTimeFrame={setPreviousBudgetPeriodTimeFrame}
          setNextBudgetPeriodTimeFrame={setNextBudgetPeriodTimeFrame}
        />
      </View>
      <View style={styles.unallocatedContainer}>
        {unallocatedFunds && (
          <>
            <Text style={styles.headerText}>{unallocatedFunds.name}</Text>
            <Text style={styles.headerValue}>${unallocatedFunds.available.toFixed(2)}</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unallocatedContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  datePickersContainer: {
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
});

export default BudgetTabHeader;
