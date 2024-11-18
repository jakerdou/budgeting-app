import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Platform } from 'react-native';
import BudgetPeriod from './BudgetPeriod';
import { updatePreferences } from '@/services/users';
import { useAuth } from '@/context/AuthProvider'; // Import useAuth hook

type PreferencesProps = {
  userId: string | undefined;
  preferences: any;
};

const Preferences: React.FC<PreferencesProps> = ({ userId, preferences }) => {
  const budgetPeriodMapping: { [key: string]: string } = {
    'Monthly': 'monthly',
    'Every Other Week': 'bi-weekly'
    // Add more mappings as needed
  };

  const reverseBudgetPeriodMapping: { [key: string]: string } = Object.fromEntries(
    Object.entries(budgetPeriodMapping).map(([key, value]) => [value, key])
  );

  const [budgetPeriod, setBudgetPeriod] = useState(reverseBudgetPeriodMapping[preferences?.budget_period] || '');
  const [startDate, setStartDate] = useState(preferences?.pay_schedule?.start_date ? new Date(preferences.pay_schedule.start_date) : new Date());

  // console.log('Preferences', preferences, budgetPeriod, startDate);

  const { updateUserPreferences } = useAuth(); // Get updateUserPreferences from context

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (budgetPeriod === '' || (budgetPeriod === 'Every Other Week' && !startDate)) {
      showAlert('Error', 'Please fill out all fields');
      return;
    }

    const apiBudgetPeriod = budgetPeriodMapping[budgetPeriod] || budgetPeriod;

    try {
      const updatedPreferences = {
        budget_period: apiBudgetPeriod,
        pay_schedule: { start_date: startDate.toISOString().split('T')[0] }
      };
      await updatePreferences(
        userId || '', 
        updatedPreferences
      );
      updateUserPreferences(updatedPreferences); // Update user preferences in context
      showAlert('Success', 'Preferences updated successfully');
    } catch (error) {
      showAlert('Error', 'Failed to update preferences');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Preferences</Text>
      <BudgetPeriod
        budgetPeriod={budgetPeriod}
        setBudgetPeriod={setBudgetPeriod}
        startDate={startDate}
        setStartDate={setStartDate}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
});

export default Preferences;
