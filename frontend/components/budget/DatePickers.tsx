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
    <View>
      <View style={styles.budgetPeriodContainer}>
        <Text>Budget Period:</Text>
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
  budgetPeriodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    height: 50,
    width: 150,
    marginLeft: 8,
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
