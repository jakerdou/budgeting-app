import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ActionSheetIOS, Text, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import TransactionsTabHeader from '@/components/transactions/TransactionsTabHeader';
import { getTransactions, addTransaction, deleteTransaction, updateTransactionCategory, syncPlaidTransactions } from '@/services/transactions';
import { Transaction } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

export default function Tab() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      await updateTransactionCategory(user?.uid || '', transactionId, newCategoryId);
      setTransactions(transactions.map(transaction => 
        transaction.id === transactionId ? { ...transaction, category_id: newCategoryId } : transaction
      ));
    } catch (error) {
      console.error('Failed to update transaction category', error);
    }
  };

  const showCategoryOptions = (transactionId: string, currentCategoryId: string) => {
    const options = categories
      .filter(category => category.id !== currentCategoryId)
      .map(category => category.name);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        buttonIndex => {
          if (buttonIndex !== options.length) {
            const selectedCategory = categories.find(category => category.name === options[buttonIndex]);
            if (selectedCategory) {
              handleChangeCategory(transactionId, selectedCategory.id);
            }
          }
        }
      );
    } else if (Platform.OS === 'web') {
      const selectedOption = window.prompt('Select Category:\n' + options.join('\n'));
      const selectedCategory = categories.find(category => category.name === selectedOption);
      if (selectedCategory) {
        handleChangeCategory(transactionId, selectedCategory.id);
      }
    } else {
      Alert.alert(
        'Select Category',
        '',
        [
          ...options.map(option => ({
            text: option,
            onPress: () => {
              const selectedCategory = categories.find(category => category.name === option);
              if (selectedCategory) {
                handleChangeCategory(transactionId, selectedCategory.id);
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
    return (
      <View style={styles.item}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.valuesContainer}>
          <Text style={styles.value}>{formatDate(item.date)}</Text>
          <TouchableOpacity onPress={() => showCategoryOptions(item.id, item.category_id)}>
            <Text style={styles.value}>{category ? category.name : 'Unknown'}</Text>
          </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      <TransactionsTabHeader onAddTransactionPress={() => setModalVisible(true)} />
      <TouchableOpacity 
        style={[styles.syncButton, isLoading && styles.syncButtonDisabled]} 
        onPress={fetchNewTransactions}
        disabled={isLoading}
      >
        <Text style={styles.syncButtonText}>
          {isLoading ? 'Syncing...' : 'Sync Transactions'}
        </Text>
      </TouchableOpacity>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.sectionHeader}>Transactions</Text>}
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
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  syncButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 10,
  },
  syncButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
