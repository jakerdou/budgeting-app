import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPeriodOnly, setShowCurrentPeriodOnly] = useState(true);
  
  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (replace: boolean = true) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch transactions for this category
      const response = await getTransactionsForCategory(
        userId, 
        category.id, 
        20,  // Limit to 20 transactions per page
        null  // No cursor for initial load
      );
      setTransactions(response.transactions || []);
      setNextCursor(response.pagination?.next_cursor || null);
      setHasMore(response.pagination?.has_more || false);
    } catch (err) {
      console.error('Failed to fetch transactions for category:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (userId && hasMore && nextCursor && !isLoadingMore) {
      try {
        setIsLoadingMore(true);
        const response = await getTransactionsForCategory(
          userId,
          category.id,
          20,  // Limit to 20 transactions per page
          nextCursor
        );
        
        // Append the new transactions to existing ones
        setTransactions(prev => [...prev, ...(response.transactions || [])]);
        setNextCursor(response.pagination?.next_cursor || null);
        setHasMore(response.pagination?.has_more || false);
      } catch (error) {
        console.error('Failed to load more transactions', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    // Reset pagination and fetch transactions when user or category changes
    setNextCursor(null);
    setHasMore(true);
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
        parseFloat(item.amount.toString()) > 0 ? styles.positiveAmount : styles.negativeAmount
      ]}>
        {parseFloat(item.amount.toString()) > 0 
          ? `+$${item.amount}` 
          : `$${Math.abs(parseFloat(item.amount.toString())).toFixed(2)}`}
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
    color: '#28a745', // Green color for positive amounts
    fontWeight: '600',
  },
  negativeAmount: {
    color: '#666', // Default color for negative amounts
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
});

export default CategoryTransactionsTab;
