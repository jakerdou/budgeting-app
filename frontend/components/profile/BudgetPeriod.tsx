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
    <View>
    {/* <View style={styles.container}> */}
      <Text>Pay Period</Text>
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
        Platform.OS === 'web' ? (          
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            // style={styles.input}
          />
        ) : (
          <></>          
          // <DateTimePicker
          //   value={new Date(startDate)}
          //   mode="date"
          //   display="default"
          //   onChange={(event, selectedDate) => {
          //     const currentDate = selectedDate || new Date(startDate);
          //   //   setShowDatePicker(false);
          //     setStartDate(formatDateToYYYYMMDD(currentDate));
          //   }}
          // />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  picker: {
    // height: 50,
    width: 200,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
});

export default BudgetPeriod;
