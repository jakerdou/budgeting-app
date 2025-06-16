// filepath: c:\Users\james\dev\budgeting-app-3\frontend\app\(tabs)\transactions.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ActionSheetIOS, Text, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import TransactionsTabHeader from '@/components/transactions/TransactionsTabHeader';
import BulkCategorySelectionBar from '@/components/transactions/BulkCategorySelectionBar';
import { getTransactions, addTransaction, deleteTransaction, updateTransactionCategory, syncPlaidTransactions } from '@/services/transactions';
import { Transaction } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import DropdownButton from '@/components/DropdownButton';
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';

export default function Tab() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCategoryChanges, setPendingCategoryChanges] = useState<Record<string, boolean>>({});
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  const fetchTransactions = async () => {
    if (user) {
      try {
        setIsLoading(true);
        const data = await getTransactions(user.uid);
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
        Alert.alert('Error', 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchNewTransactions = async () => {
    if (user) {
      try {
        setIsLoading(true);
        const data = await syncPlaidTransactions(user.uid);
        console.log('Fetched new transactions:', data);
        if (data) {
          fetchTransactions(); // Refresh the transactions list after syncing
          Alert.alert('Success', `transactions synced`);
        } else {
          console.log('No new transactions found');
          Alert.alert('Info', 'No new transactions found');
        }
      } catch (error) {
        console.error('Failed to sync transactions', error);
        Alert.alert('Error', 'Failed to sync transactions');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}-${date.getUTCFullYear().toString().slice(-2)}`;
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(user?.uid || '', transactionId);
      setTransactions(transactions.filter(transaction => transaction.id !== transactionId));
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  const showMenu = (transactionId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this transaction?');
      if (confirmed) {
        handleDeleteTransaction(transactionId);
      }
    } else {
      Alert.alert(
        'Transaction Options',
        '',
        [
          { text: 'Delete transaction', onPress: () => handleDeleteTransaction(transactionId) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };  
  const handleChangeCategory = async (transactionId: string, newCategoryId: string) => {
    // Find the transaction to update
    const transactionToUpdate = transactions.find(t => t.id === transactionId);
    if (!transactionToUpdate) return;
    
    // Store the original category_id for rollback if needed
    const originalCategoryId = transactionToUpdate.category_id;
    
    console.log(`Updating transaction ${transactionId} category: ${originalCategoryId} → ${newCategoryId}`);
    
    // Mark this transaction as having a pending change
    setPendingCategoryChanges(prev => ({ ...prev, [transactionId]: true }));
    
    // Optimistically update the UI immediately
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, category_id: newCategoryId === "null" ? null : newCategoryId } 
          : transaction
      )
    );
    
    try {
      // Make the API call in the background
      await updateTransactionCategory(user?.uid || '', transactionId, newCategoryId);
      console.log(`Category update success for transaction ${transactionId}`);
      // API call succeeded, clear the pending state
      setPendingCategoryChanges(prev => ({ ...prev, [transactionId]: false }));
    } catch (error) {
      console.error('Failed to update transaction category', error);
      
      // Show error toast/alert
      Alert.alert(
        "Update Failed",
        "Failed to update transaction category. The change has been reverted.",
        [{ text: "OK" }]
      );
      
      // Roll back the optimistic update
      setTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === transactionId 
            ? { ...transaction, category_id: originalCategoryId } 
            : transaction
        )
      );
      
      // Clear the pending state
      setPendingCategoryChanges(prev => ({ ...prev, [transactionId]: false }));
    }
  };  
  
  const showCategoryOptions = (transactionId: string, currentCategoryId: string | null) => {
    const options = ['None', ...categories
      .filter(category => category.id !== currentCategoryId)
      .map(category => category.name)];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        buttonIndex => {
          if (buttonIndex !== options.length) {
            if (options[buttonIndex] === 'None') {
              // Set category to null
              handleChangeCategory(transactionId, "null");
            } else {
              const selectedCategory = categories.find(category => category.name === options[buttonIndex]);
              if (selectedCategory) {
                handleChangeCategory(transactionId, selectedCategory.id);
              }
            }
          }
        }
      );    } else if (Platform.OS === 'web') {
      // For web, we're now using the DropdownButton component instead of this prompt
      // This legacy code is kept for non-web platforms
      const selectedOption = window.prompt('Select Category:\n' + options.join('\n'));
      if (selectedOption === 'None') {
        // Set category to null
        handleChangeCategory(transactionId, "null");
      } else {
        const selectedCategory = categories.find(category => category.name === selectedOption);
        if (selectedCategory) {
          handleChangeCategory(transactionId, selectedCategory.id);
        }
      }} else {
      Alert.alert(
        'Select Category',
        '',
        [
          ...options.map(option => ({
            text: option,
            onPress: () => {
              if (option === 'None') {
                // Set category to null
                handleChangeCategory(transactionId, "null");
              } else {
                const selectedCategory = categories.find(category => category.name === option);
                if (selectedCategory) {
                  handleChangeCategory(transactionId, selectedCategory.id);
                }
              }
            },
          })),
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };  
  const renderItem = ({ item }: { item: Transaction }) => {    
    const category = categories.find(cat => cat.id === item.category_id);
    
    // Create a list of available categories for dropdown
    const categoryOptions = categories.map(cat => cat.name);
    const currentCategoryName = item.category_id ? (category ? category.name : 'Unknown') : 'None';      
    return (
      <View style={styles.item}>
        {/* Left-aligned content */}
        <View style={styles.leftContent}>
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={selectedTransactions.includes(item.id) ? 'checked' : 'unchecked'}
              onPress={() => toggleTransactionSelection(item.id)}
            />
          </View>
          <Text style={styles.name}>{item.name}</Text>
        </View>

        {/* Right-aligned content */}
        <View style={styles.valuesContainer}>
          <Text style={styles.value}>{formatDate(item.date)}</Text>            
          {Platform.OS === 'web' ? (            
            <View style={styles.categoryContainer}>
              <Picker
                selectedValue={currentCategoryName}
                style={[
                  styles.picker, 
                  // pendingCategoryChanges[item.id] ? { opacity: 0.7 } : {}
                ]}
                // enabled={!pendingCategoryChanges[item.id]}
                onValueChange={(selectedCategoryName) => {
                  if (pendingCategoryChanges[item.id]) return; // Prevent changes while update is pending
                  
                  if (selectedCategoryName === "None") {
                    // Set category to null
                    handleChangeCategory(item.id, "null");
                  } else {
                    const selectedCategory = categories.find(cat => cat.name === selectedCategoryName);
                    if (selectedCategory && selectedCategory.id !== item.category_id) {
                      handleChangeCategory(item.id, selectedCategory.id);
                    }
                  }
                }}
              >
                <Picker.Item key="none" label="None" value="None" />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
                ))}
              </Picker>
            </View>
          ) : (
            <TouchableOpacity onPress={() => showCategoryOptions(item.id, item.category_id)}>
              <Text style={styles.value}>{currentCategoryName}</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.value}>{item.amount}</Text>
          <TouchableOpacity onPress={() => showMenu(item.id)}>
            <MaterialIcons name="more-vert" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const handleAddTransaction = async (transaction: Transaction) => {
    // Instead of just adding the transaction to the state,
    // let's fetch all transactions to ensure consistency with backend
    fetchTransactions();
  };
  
  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSelection = prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId];
      
      console.log('Selected Transactions:', newSelection);
      return newSelection;
    });
  };  
  return (
    <SafeAreaView style={styles.container}>      
    <TransactionsTabHeader 
        onAddTransactionPress={() => setModalVisible(true)}
        onSyncTransactionsPress={fetchNewTransactions}
        isSyncing={isLoading}
      />        
      {selectedTransactions.length > 0 && (
        <BulkCategorySelectionBar 
          selectedTransactions={selectedTransactions}
          categories={categories}
          userId={user?.uid}
          onCategoryUpdateComplete={fetchTransactions}
          onClearSelection={() => setSelectedTransactions([])}
        />
      )}
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        // ListHeaderComponent={<Text style={styles.sectionHeader}>Transactions</Text>}
      />
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddTransaction={handleAddTransaction}
        user={user}
        categories={categories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // Allow name to take available space but be truncated if needed
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 2,
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
    textAlign: 'right',
    minWidth: 60, // Ensure enough space for values
  },  
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,  
  },
  categoryContainer: {
    position: 'relative',
    minWidth: 120,
  },
  categoryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    height: 40,
    width: 150, // Slightly smaller to better fit in the right-aligned group
    color: '#666',
  }
});
