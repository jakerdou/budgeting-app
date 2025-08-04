// filepath: c:\Users\james\dev\budgeting-app-3\frontend\app\(tabs)\transactions.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ActionSheetIOS, Text, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import TransactionInfoModal from '@/components/transactions/TransactionInfoModal';
import TransactionsTabHeader from '@/components/transactions/TransactionsTabHeader';
import BulkCategorySelectionBar from '@/components/transactions/BulkCategorySelectionBar';
import { getTransactions, addTransaction, deleteTransaction, updateTransactionCategory, syncPlaidTransactions } from '@/services/transactions';
import { Transaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DropdownButton from '@/components/DropdownButton';
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
import ConfirmationModal from '@/components/budget/ConfirmationModal';

export default function Tab() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);  // New state for loading more
  const [pendingCategoryChanges, setPendingCategoryChanges] = useState<Record<string, boolean>>({});  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoTransaction, setSelectedInfoTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const fetchTransactions = async (replace: boolean = true) => {
    if (user) {
      try {
        setIsLoading(true);
        const data = await getTransactions(
          user.uid, 
          selectedCategoryId,
          20,  // Limit to 20 transactions per page
          null  // No cursor for initial load
        );
        setTransactions(data.transactions);
        setNextCursor(data.pagination.next_cursor);
        setHasMore(data.pagination.has_more);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
        Alert.alert('Error', 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadMoreTransactions = async () => {
    if (user && hasMore && nextCursor && !isLoadingMore) {
      try {
        setIsLoadingMore(true);
        const data = await getTransactions(
          user.uid,
          selectedCategoryId,
          20,  // Limit to 20 transactions per page
          nextCursor
        );
        
        // Append the new transactions to existing ones
        setTransactions(prev => [...prev, ...data.transactions]);
        setNextCursor(data.pagination.next_cursor);
        setHasMore(data.pagination.has_more);
      } catch (error) {
        console.error('Failed to load more transactions', error);
      } finally {
        setIsLoadingMore(false);
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
    // Reset pagination and fetch transactions when user or category filter changes
    setNextCursor(null);
    setHasMore(true);
    fetchTransactions();
  }, [user, selectedCategoryId]);

  const handleTransactionDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmVisible(true);
  };

  const confirmTransactionDelete = async () => {
    if (user && transactionToDelete) {
      try {
        await deleteTransaction(user.uid, transactionToDelete.id);
        setTransactions(transactions.filter(transaction => transaction.id !== transactionToDelete.id));
        setDeleteConfirmVisible(false);
        setTransactionToDelete(null);
      } catch (error) {
        console.error('Failed to delete transaction', error);
        setDeleteConfirmVisible(false);
        setTransactionToDelete(null);
        Alert.alert('Error', 'Failed to delete transaction');
      }
    }
  };

  const cancelTransactionDelete = () => {
    setDeleteConfirmVisible(false);
    setTransactionToDelete(null);
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
      
      // Check if the transaction should be removed from current view due to category filter
      const shouldRemoveFromView = selectedCategoryId !== null && 
        (selectedCategoryId === "null" ? newCategoryId !== "null" : newCategoryId !== selectedCategoryId);
      
      if (shouldRemoveFromView) {
        // Remove the transaction from the current view without resetting pagination
        setTransactions(prevTransactions => 
          prevTransactions.filter(transaction => transaction.id !== transactionId)
        );
      }
      // If no filter is applied or transaction still matches filter, keep it in view with updated category
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
      <View style={[
        styles.item,
        !item.category_id ? styles.uncategorizedItem : null
      ]}>
        {/* Left-aligned content */}
        <View style={styles.leftContent}>
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={selectedTransactions.includes(item.id) ? 'checked' : 'unchecked'}
              onPress={() => toggleTransactionSelection(item.id)}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={[
              styles.name, 
              !item.category_id ? styles.uncategorizedName : null
            ]}>
              {item.name}
            </Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {
                setSelectedInfoTransaction(item);
                setInfoModalVisible(true);
              }}
              accessibilityLabel={`Show info for ${item.name}`}
            >
              <Ionicons 
                name="information-circle-outline" 
                size={22} 
                color="#007BFF" 
                accessibilityLabel="Info"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right-aligned content */}
        <View style={styles.valuesContainer}>
          <Text style={styles.value}>{item.date}</Text>        
          {/* <Text style={{...styles.value, ...(currentCategoryName === 'None' ? styles.noneText : null)}}>{item.date}</Text>         */}
          {Platform.OS === 'web' ? (            
            <View style={styles.categoryContainer}>
              <Picker
                selectedValue={currentCategoryName}
                style={[
                  styles.picker, 
                  currentCategoryName === 'None' ? styles.nonePickerText : null
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
                <Picker.Item 
                  key="none" 
                  label="None" 
                  value="None"
                />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
                ))}
              </Picker>
            </View>
          ) : (
            <TouchableOpacity onPress={() => showCategoryOptions(item.id, item.category_id)}>
              <Text style={[
                styles.value, 
                // currentCategoryName === 'None' ? styles.noneText : null
              ]}>
                {currentCategoryName}
              </Text>
            </TouchableOpacity>
          )}
          
          <Text style={[
            styles.value, 
            parseFloat(item.amount.toString()) > 0 ? styles.positiveAmount : styles.negativeAmount,
            // currentCategoryName === 'None' ? styles.noneText : null
          ]}>
            {parseFloat(item.amount.toString()) > 0 
              ? `+$${item.amount}` 
              : `$${Math.abs(parseFloat(item.amount.toString())).toFixed(2)}`}
          </Text>
          <TouchableOpacity
            style={[styles.deleteButton, Platform.OS === 'web' && styles.webDeleteButton]}
            onPress={() => handleTransactionDelete(item)}
            role="button"
            aria-label={`Delete ${item.name} transaction`}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color="red" 
              accessibilityLabel="Delete"
            />
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
      return newSelection;    });
  };    
  
  // The filtering is now handled server-side by passing the category_id to the API
  // We don't need to filter on the client, as the transactions array already contains
  // the filtered results from the API
  const displayedTransactions = transactions;

  // console.log('transactions[0]:', transactions[0]);
  
  return (
    <SafeAreaView style={styles.container}>        
    <TransactionsTabHeader 
        onAddTransactionPress={() => setModalVisible(true)}
        onSyncTransactionsPress={fetchNewTransactions}
        isSyncing={isLoading}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryFilterChange={(categoryId) => setSelectedCategoryId(categoryId)}
      />
      {selectedTransactions.length > 0 && (
        <BulkCategorySelectionBar 
          selectedTransactions={selectedTransactions}
          categories={categories}
          userId={user?.uid}
          onCategoryUpdateComplete={() => {
            fetchTransactions();
            setSelectedTransactions([]); // Clear selection after bulk update
          }}
          onClearSelection={() => setSelectedTransactions([])}
        />
      )}        
      {displayedTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedCategoryId === "null"
              ? "No uncategorized transactions found" 
              : selectedCategoryId
                ? "No transactions found in this category"
                : "No transactions found"}
          </Text>
          <Text style={styles.emptySubtext}>
            {selectedCategoryId !== null
              ? "Try selecting a different category filter" 
              : "Try adding a transaction or syncing with your bank account"}
          </Text>
        </View>
      ) : (        
        <FlatList
          data={displayedTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          // ListHeaderComponent={<Text style={styles.sectionHeader}>Transactions</Text>}
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <Text style={styles.loadingText}>Loading more transactions...</Text>
              </View>
            ) : hasMore ? (
              <TouchableOpacity 
                style={styles.loadMoreButton} 
                onPress={loadMoreTransactions}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.endOfListText}>No more transactions</Text>
            )
          }
          refreshing={isLoading}
          onRefresh={() => fetchTransactions()}
        />
      )}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddTransaction={handleAddTransaction}
        user={user}
        categories={categories}
      />
      <TransactionInfoModal
        visible={infoModalVisible}
        transaction={selectedInfoTransaction}
        category={selectedInfoTransaction ? categories.find(cat => cat.id === selectedInfoTransaction.category_id) || null : null}
        onClose={() => setInfoModalVisible(false)}
      />
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="destructive"
        onConfirm={confirmTransactionDelete}
        onCancel={cancelTransactionDelete}
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
  uncategorizedItem: {
    backgroundColor: '#fffbf0', // Light yellow background for uncategorized transactions
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // Allow name to take available space but be truncated if needed
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  uncategorizedName: {
    color: '#999', // Grey color for uncategorized transactions
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
  positiveAmount: {
    color: '#28a745', // Green color for positive amounts
    fontWeight: '600',
  },
  negativeAmount: {
    color: '#666', // Default color for negative amounts
  },    sectionHeader: {
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
    width: 170,
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
  nonePickerItem: {
    color: '#bbb', // Lighter grey color for "None" option
    fontStyle: 'italic',
  },
  nonePickerText: {
    // color: '#bbb', // Lighter grey color for "None" in picker
    fontStyle: 'italic',
  },
  noneText: {
    color: '#bbb', // Lighter grey color for "None" text
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: '80%',
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 10,
  },
  loadMoreButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
  },
  endOfListText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  webDeleteButton: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
