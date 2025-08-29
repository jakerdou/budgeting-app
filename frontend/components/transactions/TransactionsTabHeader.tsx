import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import BankLinkButtonIOS from './BankLinkButtonIOS';
import BankLinkButtonWeb from './BankLinkButtonWeb';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/types';

interface TransactionsTabHeaderProps {
  onAddTransactionPress: () => void;
  onSyncTransactionsPress: () => void;
  isSyncing?: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryFilterChange: (categoryId: string | null) => void;
  hasUncategorizedTransactions?: boolean;
}

const TransactionsTabHeader: React.FC<TransactionsTabHeaderProps> = ({ 
  onAddTransactionPress,
  onSyncTransactionsPress,
  isSyncing = false,
  categories,
  selectedCategoryId,
  onCategoryFilterChange,
  hasUncategorizedTransactions = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);  // Determine which option is selected
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>Transactions</Text>
          {hasUncategorizedTransactions && (
            <TouchableOpacity 
              style={[
                styles.uncategorizedMessage,
                isHovered && styles.uncategorizedMessageHover
              ]}
              onPress={() => onCategoryFilterChange("null")}
              {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
              } : {})}
            >
              <Ionicons name="alert-circle" size={14} color="#000" style={styles.alertIcon} />
              <Text style={styles.uncategorizedMessageText}>
                Some transactions need categories
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterContainer}>
          <Text style={styles.filterText}>Filter by: </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedValue}
              style={styles.picker}
              onValueChange={handleValueChange}
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
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={onAddTransactionPress}
        >
          <Text style={styles.addButtonText}>Add Transaction</Text>
        </TouchableOpacity>
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uncategorizedMessage: {
    backgroundColor: '#fffbf0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f0e68c',
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer',
  },
  uncategorizedMessageHover: {
    backgroundColor: '#f5f0d6',
    borderColor: '#e6d85c',
  },
  alertIcon: {
    marginRight: 4,
  },
  uncategorizedMessageText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
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
    overflow: 'hidden',
    minWidth: 160,
  },
  picker: {
    height: 40,
    width: 160,
    color: '#374151',
    fontSize: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
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
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TransactionsTabHeader;
