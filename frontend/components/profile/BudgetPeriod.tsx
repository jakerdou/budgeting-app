import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

type BudgetPeriodProps = {  budgetPeriod: string;
  setBudgetPeriod: (value: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
};

const BudgetPeriod: React.FC<BudgetPeriodProps> = ({ budgetPeriod, setBudgetPeriod, startDate, setStartDate }) => {
  const [showDatePicker, setShowDatePicker] = useState(budgetPeriod === 'Every Other Week');


  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pay Period</Text>
      <Picker
        selectedValue={budgetPeriod}
        style={styles.picker}
        onValueChange={(itemValue: string) => {
          setBudgetPeriod(itemValue);
          if (itemValue === 'Every Other Week') {
            setShowDatePicker(true);
          } else {
            setShowDatePicker(false);
          }
        }}
      >
        <Picker.Item label="Select Your Pay Period" value="" />
        <Picker.Item label="Monthly" value="Monthly" />
        <Picker.Item label="Every Other Week" value="Every Other Week" />
      </Picker>
      {budgetPeriod === 'Every Other Week' && showDatePicker && (
        <View style={styles.dateContainer}>
          {Platform.OS === 'web' ? (          
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.dateInput}
            />
          ) : (
            <></>          
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  picker: {
    height: 40,
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  dateContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#ffffff',
    fontSize: 14,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
});

export default BudgetPeriod;
