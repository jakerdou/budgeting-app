import React from 'react';
import { Platform, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for arrow buttons
import DropdownButton from '../DropdownButton'; // Import the new DropdownButton component

type DatePickersProps = {
    startDate: string;
    endDate: string;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    preferences?: any;
    budgetPeriod: string;
    setBudgetPeriod: (period: string) => void;
    setPreviousBudgetPeriodTimeFrame: (budgetPeriod: string, currentStartDate: string, currentEndDate: string, setStartDate: (date: string) => void, setEndDate: (date: string) => void) => void;
    setNextBudgetPeriodTimeFrame: (budgetPeriod: string, currentStartDate: string, currentEndDate: string, setStartDate: (date: string) => void, setEndDate: (date: string) => void) => void;
};

const DatePickers: React.FC<DatePickersProps> = ({ startDate, endDate, setStartDate, setEndDate, preferences, budgetPeriod, setBudgetPeriod, setPreviousBudgetPeriodTimeFrame, setNextBudgetPeriodTimeFrame }) => {
  const budgetPeriods = ['Yearly', 'Monthly', 'Pay Period'];

  const budgetPeriodsMapping: { [key: string]: string } = {
    'yearly': 'Yearly',
    'monthly': 'Monthly',
    [preferences?.budget_period]: 'Pay Period',
  };
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    // Parse the YYYY-MM-DD string into a display format MM-DD-YY
    const [year, month, day] = dateStr.split('-');
    return `${month}-${day}-${year.slice(-2)}`;
  };

  return (
    <View style={styles.datePickerContainer}>
      <View style={styles.budgetPeriodContainer}>
        <Text style={styles.budgetPeriodLabel}>Budget Period:</Text>
        {Platform.OS === 'ios' ? (
          <DropdownButton
            options={budgetPeriods}
            selectedOption={budgetPeriodsMapping[budgetPeriod]}
            onSelect={(itemValue) => {
              if (itemValue === 'Yearly') {
                setBudgetPeriod('yearly');
                // setBudgetPeriod('app-yearly');
              } else if (itemValue === 'Monthly') {
                setBudgetPeriod('monthly');
                // setBudgetPeriod('app-monthly');
              } else if (itemValue === 'Pay Period') {
                setBudgetPeriod(preferences?.budget_period);
              }
            }}
            modalPosition="below"
          />
        ) : (
          <Picker
            selectedValue={budgetPeriodsMapping[budgetPeriod]}
            onValueChange={(itemValue) => {
              if (itemValue === 'Yearly') {
                setBudgetPeriod('yearly');
                // setBudgetPeriod('app-yearly');
              } else if (itemValue === 'Monthly') {
                setBudgetPeriod('monthly');
                // setBudgetPeriod('app-monthly');
              } else if (itemValue === 'Pay Period') {
                setBudgetPeriod(preferences?.budget_period);
              }
            }}
            style={styles.picker}
          >
            {budgetPeriods.map((period) => (
              <Picker.Item key={period} label={period} value={period} />
            ))}
          </Picker>
        )}
      </View>
      <View style={styles.dateDisplayContainer}>
        <TouchableOpacity onPress={() => setPreviousBudgetPeriodTimeFrame(budgetPeriod, startDate, endDate, setStartDate, setEndDate)}>
          <Ionicons name="caret-back-circle" size={32} color="grey" />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
        <Text style={styles.toText}>to</Text>
        <Text style={styles.dateText}>{formatDate(endDate)}</Text>
        <TouchableOpacity onPress={() => setNextBudgetPeriodTimeFrame(budgetPeriod, startDate, endDate, setStartDate, setEndDate)}>
          <Ionicons name="caret-forward-circle" size={32} color="grey" />
        </TouchableOpacity>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  datePickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetPeriodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  budgetPeriodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  toText: {
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 4,
  },
  picker: {
    height: 40,
    width: 160,
    marginLeft: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 24,
    paddingHorizontal: 8,
  },
});

export default DatePickers;
