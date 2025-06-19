import React from 'react';
import { View, Text, Button, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import BankLinkButtonIOS from './BankLinkButtonIOS';
import BankLinkButtonWeb from './BankLinkButtonWeb';
import { Picker } from '@react-native-picker/picker';
import { Category } from '@/types';

interface TransactionsTabHeaderProps {
  onAddTransactionPress: () => void;
  onSyncTransactionsPress: () => void;
  isSyncing?: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryFilterChange: (categoryId: string | null) => void;
}

const TransactionsTabHeader: React.FC<TransactionsTabHeaderProps> = ({ 
  onAddTransactionPress,
  onSyncTransactionsPress,
  isSyncing = false,
  categories,
  selectedCategoryId,
  onCategoryFilterChange
}) => {  // Determine which option is selected
  let selectedValue = "All";
  if (selectedCategoryId === "null") {
    selectedValue = "Uncategorized";
  } else if (selectedCategoryId) {
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    if (selectedCategory) {
      selectedValue = selectedCategory.name;
    }
  }

  // Handle selection change
  const handleValueChange = (itemValue: string) => {
    if (itemValue === "All") {
      onCategoryFilterChange(null);
    } else if (itemValue === "Uncategorized") {
      onCategoryFilterChange("null");
    } else {
      const category = categories.find(cat => cat.name === itemValue);
      if (category) {
        onCategoryFilterChange(category.id);
      }
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.filterContainer}>
          <Text style={styles.filterText}>Filter by: </Text>          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedValue}
              style={[styles.picker, Platform.OS === 'web' ? { height: 35 } : {}]}
              onValueChange={handleValueChange}
              itemStyle={Platform.OS === 'web' ? { fontSize: 14 } : {}}
            >
              <Picker.Item key="all" label="All" value="All" />
              <Picker.Item key="uncategorized" label="Uncategorized" value="Uncategorized" />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        {Platform.OS === 'web' && <BankLinkButtonWeb />}
        {/* {Platform.OS === 'web' ? <BankLinkButtonWeb /> : Platform.OS === 'ios' ? <BankLinkButtonIOS /> : null} */}
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
          onPress={onSyncTransactionsPress}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Transactions'}
          </Text>
        </TouchableOpacity>
        <Button title="Add Transaction" onPress={onAddTransactionPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 150,
  },
  picker: {
    height: 35,
    width: 150,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TransactionsTabHeader;
