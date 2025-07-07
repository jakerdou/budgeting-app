import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Category } from '@/types';
import { useAuth } from '@/context/AuthProvider';
import { updateCategoryGoal } from '@/services/categories';

interface CategoryGoalTabProps {
  category: Category;
  onGoalUpdate?: (categoryId: string, goalAmount: number | null) => void;
}

const CategoryGoalTab: React.FC<CategoryGoalTabProps> = ({ category, onGoalUpdate }) => {
  const { user } = useAuth();
  const [goalAmount, setGoalAmount] = useState(category.goal_amount?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when category prop changes
  useEffect(() => {
    setGoalAmount(category.goal_amount?.toString() || '');
  }, [category.goal_amount]);

  const handleSaveGoal = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const numericGoal = parseFloat(goalAmount);
    if (goalAmount && (isNaN(numericGoal) || numericGoal < 0)) {
      Alert.alert('Error', 'Please enter a valid positive number');
      return;
    }

    setIsSaving(true);
    try {
      await updateCategoryGoal(user.uid, category.id, numericGoal || 0);
      // Update the category object immediately for UI responsiveness
      const updatedCategory = { ...category, goal_amount: numericGoal || undefined };
      onGoalUpdate?.(category.id, numericGoal || null);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal amount');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setGoalAmount(category.goal_amount?.toString() || '');
    setIsEditing(false);
  };

  const currentGoal = category.goal_amount || 0;
  const currentAllocated = category.allocated || 0;
  const progressPercentage = currentGoal > 0 ? Math.min((currentAllocated / currentGoal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Summary</Text>
        <Text style={styles.text}>
          Set and track spending goals for your {category.name} category.
        </Text>
      </View> */}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Amount</Text>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={goalAmount}
              onChangeText={setGoalAmount}
              placeholder="Enter goal amount"
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleSaveGoal} style={styles.saveButton} disabled={isSaving}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.goalDisplay}>
            <Text style={styles.goalText}>
              {currentGoal > 0 ? `$${currentGoal.toFixed(2)}` : 'No goal set'}
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {currentGoal > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            ${currentAllocated.toFixed(2)} of ${currentGoal.toFixed(2)} allocated ({progressPercentage.toFixed(1)}%)
          </Text>
          {progressPercentage >= 100 && (
            <Text style={styles.goalMetText}>🎉 Goal reached!</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  editContainer: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  goalDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  goalText: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalMetText: {
    fontSize: 16,
    color: '#34C759',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});

export default CategoryGoalTab;
