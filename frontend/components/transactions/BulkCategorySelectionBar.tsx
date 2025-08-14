import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Category } from '@/types';
import { updateTransactionCategory, bulkDeleteTransactions } from '@/services/transactions';
import { MaterialIcons } from '@expo/vector-icons';

interface BulkCategorySelectionBarProps {
  selectedTransactions: string[];
  categories: Category[];
  userId: string | undefined;
  onCategoryUpdateComplete?: () => void;
  onClearSelection?: () => void;
  onBulkDeleteComplete?: () => void;
}

const BulkCategorySelectionBar: React.FC<BulkCategorySelectionBarProps> = ({
  selectedTransactions,
  categories,
  userId,
  onCategoryUpdateComplete,
  onClearSelection,
  onBulkDeleteComplete
}) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("None");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleBulkDelete = () => {
    console.log('handleBulkDelete called with transactions:', selectedTransactions);
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedTransactions.length} transaction(s)? This operation cannot be reversed.`
      );
      if (confirmed) {
        confirmBulkDelete();
      }
    } else {
      Alert.alert(
        'Delete Transactions',
        `Are you sure you want to delete ${selectedTransactions.length} transaction(s)? This operation cannot be reversed.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmBulkDelete,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const confirmBulkDelete = async () => {
    console.log('confirmBulkDelete called');
    if (!userId || selectedTransactions.length === 0) {
      console.log('Early return - no userId or no selected transactions');
      return;
    }
    
    console.log('Starting bulk delete operation');
    setIsDeleting(true);
    
    try {
      console.log(`Deleting ${selectedTransactions.length} transactions`);
      
      const results = await bulkDeleteTransactions(userId, selectedTransactions);
      console.log('Bulk delete results:', results);
      
      const failedDeletes = results.filter(result => !result.success);
      
      if (failedDeletes.length > 0) {
        console.log('Some deletes failed:', failedDeletes);
        if (Platform.OS === 'web') {
          window.alert(
            `Delete Completed with Errors: ${results.length - failedDeletes.length} transactions deleted successfully, ${failedDeletes.length} failed to delete.`
          );
        } else {
          Alert.alert(
            'Delete Completed with Errors',
            `${results.length - failedDeletes.length} transactions deleted successfully, ${failedDeletes.length} failed to delete.`
          );
        }
      } else {
        console.log('All deletes successful');
        if (Platform.OS === 'web') {
          window.alert(`Delete Completed: ${selectedTransactions.length} transaction(s) deleted successfully.`);
        } else {
          Alert.alert(
            'Delete Completed',
            `${selectedTransactions.length} transaction(s) deleted successfully.`
          );
        }
      }
      
      if (onBulkDeleteComplete) {
        console.log('Calling onBulkDeleteComplete callback');
        onBulkDeleteComplete();
      }
    } catch (error) {
      console.error('Failed to delete transactions', error);
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to delete transactions');
      } else {
        Alert.alert('Error', 'Failed to delete transactions');
      }
    } finally {
      console.log('Bulk delete operation completed');
      setIsDeleting(false);
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
        
        <TouchableOpacity 
          style={[styles.bulkDeleteButton, isDeleting && styles.bulkDeleteButtonDisabled]}
          onPress={() => {
            console.log('Delete button pressed');
            handleBulkDelete();
          }}
          disabled={isDeleting}
        >
          <MaterialIcons 
            name="delete" 
            size={16} 
            color={isDeleting ? "#ff9999" : "white"} 
            style={styles.deleteIcon}
          />
          <Text style={styles.bulkDeleteButtonText}>
            {isDeleting ? 'Deleting...' : 'Delete'}
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
  },
  bulkDeleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
    minWidth: 80,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  bulkDeleteButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  bulkDeleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  deleteIcon: {
    marginRight: 2,
  }
});

export default BulkCategorySelectionBar;
