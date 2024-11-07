import React from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type DatePickersProps = {
    startDate: Date;
    endDate: Date;
    setStartDate: (date: Date) => void;
    setEndDate: (date: Date) => void;
};

const DatePickers: React.FC<DatePickersProps> = ({ startDate, endDate, setStartDate, setEndDate}) => {
  return (
    <View>
      <View style={{ alignItems: 'center', marginLeft: 16 }}>
        <Text>Budget Period</Text>
      </View>
      <View style={styles.datePickerContainer}>
        {Platform.OS === 'web' ? (
          <>
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              style={styles.dateInput}
            />
            <Text> to </Text>
            <input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              style={styles.dateInput}
            />
          </>
        ) : (
          <>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setStartDate(selectedDate);
                }}
                style={styles.dateTimePicker}
              />
            </View>
            <Text style={styles.toText}>to</Text>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setEndDate(selectedDate);
                }}
                style={styles.dateTimePicker}
              />
            </View>
          </>
        )}
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerWrapper: {
    // flex: 1, // Ensures the DateTimePicker component fills available space
    padding: 0,
    margin: 0,
    overflow: 'hidden', // Ensures no extra padding or margin
  },
  dateTimePicker: {
    width: 100, // Ensures it takes full width of the wrapper
    paddingHorizontal: 0, // Remove any internal padding
    margin: 0, // Remove any internal margin
  },
  dateInput: {
    width: 150, // Set a fixed width for web date input
  },
  toText: {
    marginLeft: 8,
    marginRight: -8,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default DatePickers;
