import React, { useEffect, useState, useCallback } from 'react';
import { View, SafeAreaView, Text, StyleSheet, FlatList, Button, Platform, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddCategoryModal from '@/components/AddCategoryModal';
import AssignmentModal from '@/components/AssignmentModal';
import DatePickers from '@/components/DatePickers';
import { getAllocated } from '@/services/categories';
import { Category } from '@/types';

// type Category = {
//   id: string;
//   name: string;
//   allocated: number;
//   available: number;
// };

export default function Tab() {
  const { user } = useAuth();
  const { categories, loading } = useCategories();
  const [allocated, setAllocated] = useState<any[]>([]);
  const [unallocatedFunds, setUnallocatedFunds] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date('2024-11-01T04:00:00Z'));
  const [endDate, setEndDate] = useState(new Date('2024-11-14T23:59:59Z'));
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchAllocated = useCallback(async () => {
    if (user) {
      try {
        const data = await getAllocated(user.uid, startDate, endDate);
        setAllocated(data.allocated);

        const unallocated = categories.find((category: any) => category.is_unallocated_funds) || null;
        setUnallocatedFunds(unallocated);
      } catch (error) {
        console.error('Failed to fetch allocated data', error);
      }
    }
  }, [user, startDate, endDate, categories]);

  useEffect(() => {
    fetchAllocated();
  }, [fetchAllocated]);

  const getAllocatedAmount = (categoryId: string) => {
    const allocation = allocated.find((alloc) => alloc.category_id === categoryId);
    return allocation ? allocation.allocated : 0;
  };

  const renderItem = ({ item }: { item: Category }) => {
    const allocatedAmount = getAllocatedAmount(item.id);
    return (
      <TouchableOpacity onPress={() => setSelectedCategory(item)}>
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.valuesContainer}>
            <Text style={styles.value}>Allocated: ${allocatedAmount.toFixed(2)}</Text>
            <Text style={styles.value}>Available: ${item.available.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.unallocatedContainer}>
          {unallocatedFunds && (
            <>
              <Text style={styles.headerText}>{unallocatedFunds.name}</Text>
              <Text style={styles.headerValue}>${unallocatedFunds.available.toFixed(2)}</Text>
            </>
          )}
        </View>
        <View style={styles.datePickersContainer}>
          <DatePickers
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </View>
      </View>
      {categories.length > 0 && (
        <FlatList
          data={categories.filter((category: any) => !category.is_unallocated_funds)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View style={styles.footer}>
              <Button title="Add Category" onPress={() => setModalVisible(true)} />
            </View>
          }
        />
      )}
      <AddCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userId={user?.uid}
        onNewCategory={() => fetchAllocated()} // Refresh categories after adding
      />
      <AssignmentModal
        visible={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        userId={user?.uid || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unallocatedContainer: {
    flexDirection: 'column',
  },
  datePickersContainer: {
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});
