import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getTransactionsForCategory } from '@/services/transactions';
import { Transaction, Category } from '@/types';
import { Checkbox } from 'react-native-paper';

interface CategoryTransactionsTabProps {
  category: Category;
  userId: string | undefined;
  startDate: string;
  endDate: string;
}

const CategoryTransactionsTab: React.FC<CategoryTransactionsTabProps> = ({ 
  category, 
  userId, 
  startDate, 
  endDate 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPeriodOnly, setShowCurrentPeriodOnly] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch transactions for this category
        const response = await getTransactionsForCategory(userId, category.id);
        setTransactions(response.transactions || []);
      } catch (err) {
        console.error('Failed to fetch transactions for category:', err);
        setError('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [userId, category.id]);

  useEffect(() => {
    // Filter transactions based on current period setting
    if (showCurrentPeriodOnly && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filtered = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= start && transactionDate <= end;
      });
      
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [transactions, showCurrentPeriodOnly, startDate, endDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionName}>{item.name}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>      
      <Text style={[
        styles.transactionAmount,
        Number(item.amount) < 0 ? styles.negativeAmount : styles.positiveAmount
      ]}>
        ${Number(item.amount).toFixed(2)}
        {/* ${Math.abs(Number(item.amount)).toFixed(2)} */}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>      
        <View style={styles.filterContainer}>
            <Checkbox
                status={showCurrentPeriodOnly ? 'checked' : 'unchecked'}
                onPress={() => setShowCurrentPeriodOnly(!showCurrentPeriodOnly)}
            />
            <Text style={styles.filterText}>Show current budget period only</Text>
        </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions found for this category</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterText: {
    fontSize: 14,
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  positiveAmount: {
    color: 'green',
  },
  negativeAmount: {
    color: 'red',
  },
});

export default CategoryTransactionsTab;
