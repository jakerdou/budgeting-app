import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddTransactionModal from '@/components/AddTransactionModal';
import { useNavigation } from '@react-navigation/native';
import { getTransactions, addTransaction } from '@/services/transactions';
import { Transaction } from '@/types';

export default function Tab() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Add Transaction" onPress={() => setModalVisible(true)} />
      ),
    });
  }, [navigation]);

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
    const options: Intl.DateTimeFormatOptions = { year: '2-digit', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const category = categories.find(cat => cat.id === item.category_id);
    return (
      <View style={styles.item}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.valuesContainer}>
          <Text style={styles.value}>{formatDate(item.date)}</Text>
          <Text style={styles.value}>{category ? category.name : 'Unknown'}</Text>
          <Text style={styles.value}>{item.amount}</Text>
        </View>
      </View>
    );
  };

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
    console.log('transaction', transaction, 'transactions', transactions);
  };

  return (
    <View style={styles.container}>
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
    </View>
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
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
});
