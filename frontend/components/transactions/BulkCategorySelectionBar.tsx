import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Category } from '@/types';
import { updateTransactionCategory } from '@/services/transactions';
import { MaterialIcons } from '@expo/vector-icons';

interface BulkCategorySelectionBarProps {
  selectedTransactions: string[];
  categories: Category[];
  userId: string | undefined;
  onCategoryUpdateComplete?: () => void;
  onClearSelection?: () => void;
}

const BulkCategorySelectionBar: React.FC<BulkCategorySelectionBarProps> = ({
  selectedTransactions,
  categories,
  userId,
  onCategoryUpdateComplete,
  onClearSelection
}) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("None");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkCategoryUpdate = async () => {
    if (!userId || selectedTransactions.length === 0) return;
    
    setIsUpdating(true);
    
    try {
      const categoryId = selectedCategoryName === "None" 
        ? "null" 
        : categories.find(cat => cat.name === selectedCategoryName)?.id;

      console.log(`Updating ${selectedTransactions.length} transactions to category: ${selectedCategoryName} (${categoryId})`);
      
      // Process transactions in sequence to avoid overwhelming the API
      for (const transactionId of selectedTransactions) {
        await updateTransactionCategory(userId, transactionId, categoryId || "null");
        console.log(`Updated transaction ${transactionId} to category ${categoryId}`);
      }
      
      if (onCategoryUpdateComplete) {
        onCategoryUpdateComplete();
      }
    } catch (error) {
      console.error('Failed to update transaction categories', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMobilePickerPress = () => {
    // For mobile platforms, show a selection dialog
    if (Platform.OS === 'ios') {
      // Implementation for iOS would go here, similar to the one in transactions.tsx
    } else {
      // Implementation for Android would go here
    }
  };
  return (
    <View style={styles.selectionRibbon}>
      <View style={styles.selectionTextContainer}>
        <TouchableOpacity 
          style={styles.clearSelectionButton}
          onPress={onClearSelection}
          accessibilityLabel="Clear selection"
        >
          <MaterialIcons name="close" size={16} color="#0369a1" />
        </TouchableOpacity>
        <Text style={styles.selectionRibbonText}>
          {selectedTransactions.length} transaction(s) selected
        </Text>
      </View>
      
      <View style={styles.bulkActionContainer}>
        <Text style={styles.bulkActionText}>Select Category:</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.bulkCategoryPickerContainer}>
            <Picker
              selectedValue={selectedCategoryName}
              style={styles.bulkCategoryPicker}
              onValueChange={(value) => {
                setSelectedCategoryName(value);
                console.log('Selected bulk category:', value, 'selectedTransactions:', selectedTransactions);
              }}
            >
              <Picker.Item key="none-bulk" label="None" value="None" />
              {categories.map((cat) => (
                <Picker.Item key={`bulk-${cat.id}`} label={cat.name} value={cat.name} />
              ))}
            </Picker>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.bulkCategoryPickerContainer, {justifyContent: 'center', paddingHorizontal: 8}]}
            onPress={handleMobilePickerPress}
          >
            <Text style={{color: '#0369a1'}}>{selectedCategoryName}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.bulkActionButton, isUpdating && styles.bulkActionButtonDisabled]}
          onPress={handleBulkCategoryUpdate}
          disabled={isUpdating}
        >
          <Text style={styles.bulkActionButtonText}>
            {isUpdating ? 'Applying...' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectionRibbon: {
    backgroundColor: '#e0f2fe',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  selectionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearSelectionButton: {
    marginLeft: 8,
    padding: 2,
  },
  selectionRibbonText: {
    color: '#0369a1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bulkActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkActionText: {
    marginRight: 8,
    color: '#0369a1',
    fontSize: 16,
  },
  bulkCategoryPickerContainer: {
    width: 150,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bulkCategoryPicker: {
    height: 36,
    width: 150,
    color: '#0369a1',
  },
  bulkActionButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkActionButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  bulkActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default BulkCategorySelectionBar;
