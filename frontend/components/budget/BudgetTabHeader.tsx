import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DatePickers from '@/components/budget/DatePickers';
import { Category } from '@/types';

interface BudgetTabHeaderProps {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  userPreferences: any;
  setBudgetPeriod: (period: string) => void;
  budgetPeriod: string;
  setPreviousBudgetPeriodTimeFrame: (budgetPeriod: string, currentStartDate: string, currentEndDate: string, setStartDate: (date: string) => void, setEndDate: (date: string) => void) => void;
  setNextBudgetPeriodTimeFrame: (budgetPeriod: string, currentStartDate: string, currentEndDate: string, setStartDate: (date: string) => void, setEndDate: (date: string) => void) => void;
  unallocatedFunds: Category | null;
  unallocatedIncome: number;
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
  unallocatedIncome,
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
            <Text style={[styles.headerValue, unallocatedFunds.available < 0 && styles.negativeValue]}>
              {unallocatedFunds.available >= 0 ? '$' : '-$'}{Math.abs(unallocatedFunds.available).toFixed(2)}
            </Text>
            <Text style={styles.incomeLabel}>Income This Period:</Text>
            <Text style={[styles.incomeValue, unallocatedIncome >= 0 ? styles.positiveValue : styles.negativeValue]}>
              {unallocatedIncome >= 0 ? '$' : '-$'}{Math.abs(unallocatedIncome).toFixed(2)}
            </Text>
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
  negativeValue: {
    color: 'red',
  },
  incomeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  positiveValue: {
    // color: '#28a745',
  },
});

export default BudgetTabHeader;
