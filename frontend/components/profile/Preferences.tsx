import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Platform, TouchableOpacity } from 'react-native';
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
  
  const [startDate, setStartDate] = useState(preferences?.pay_schedule?.start_date ? preferences.pay_schedule.start_date : null);

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
        pay_schedule: { start_date: startDate }
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
      {/* <Text style={styles.title}>Preferences</Text> */}
      <BudgetPeriod
        budgetPeriod={budgetPeriod}
        setBudgetPeriod={setBudgetPeriod}
        startDate={startDate}
        setStartDate={setStartDate}
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Preferences;
