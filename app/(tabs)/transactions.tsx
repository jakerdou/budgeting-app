import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ActionSheetIOS, Text, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import TransactionsTabHeader from '@/components/transactions/TransactionsTabHeader';
import { getTransactions, addTransaction, deleteTransaction, updateTransactionCategory } from '@/services/transactions';
import { Transaction } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
// import { SafeAreaView } from 'react-native-safe-area-context';

export default function Tab() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchTransactions = async () => {
    if (user) {
      try {
        const data = await getTransactions(user.uid);
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
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

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TransactionsTabHeader onAddTransactionPress={() => setModalVisible(true)} />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
});
