import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '@/types';

interface CategoryGoalTabProps {
  category: Category;
}

const CategoryGoalTab: React.FC<CategoryGoalTabProps> = ({ category }) => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Summary</Text>
        <Text style={styles.text}>
          Set and track savings goals for your {category.name} category.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Progress</Text>
        <Text style={styles.text}>
          You have not set a goal for this category yet.
        </Text>
        {/* Placeholder for a progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: '0%' }]} />
        </View>
        <Text style={styles.subtext}>
          $0 of $0 saved
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Settings</Text>
        <Text style={styles.text}>
          Target Amount: Not set
        </Text>
        <Text style={styles.text}>
          Target Date: Not set
        </Text>
        <Text style={styles.text}>
          Recommended Monthly Contribution: Not set
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historical Performance</Text>
        <Text style={styles.text}>
          Average Monthly Savings: $0
        </Text>
        <Text style={styles.text}>
          Estimated Completion Date: N/A
        </Text>
      </View>
      
      <Text style={styles.note}>
        Note: Goal tracking is a placeholder feature and will be implemented in a future update.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  subtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default CategoryGoalTab;
