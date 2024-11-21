import React, { useEffect, useState, useCallback } from 'react';
import { View, SafeAreaView, Text, StyleSheet, FlatList, Button, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddCategoryModal from '@/components/budget/AddCategoryModal';
import AssignmentModal from '@/components/budget/AssignmentModal';
import BudgetTabHeader from '@/components/budget/BudgetTabHeader';
import { getAllocated } from '@/services/categories';
import { Category } from '@/types';
import {
  setMonthlyDates,
  setBiWeeklyDates,
  setYearlyDates,
  setPreviousBudgetPeriodTimeFrame,
  setNextBudgetPeriodTimeFrame
} from '@/utils/dateUtils';

export default function Tab() {
  const { user } = useAuth();
  const { categories, loading } = useCategories();
  const [allocated, setAllocated] = useState<any[]>([]);
  const [unallocatedFunds, setUnallocatedFunds] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [budgetPeriod, setBudgetPeriod] = useState(user?.preferences.budget_period);

  useEffect(() => {
    if (budgetPeriod === 'monthly') {
      setMonthlyDates(setStartDate, setEndDate);
    } else if (budgetPeriod === 'bi-weekly') {
      setBiWeeklyDates(user?.preferences.pay_schedule || {}, setStartDate, setEndDate);
    } else if (budgetPeriod === 'yearly') {
      setYearlyDates(setStartDate, setEndDate);
    }
  }, [budgetPeriod, user]);

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

  if (loading) {
    return <Text>Loading...</Text>;
  }
  return (
    <SafeAreaView style={styles.container}>
      <BudgetTabHeader
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        userPreferences={user?.preferences}
        setBudgetPeriod={setBudgetPeriod}
        budgetPeriod={budgetPeriod}
        setPreviousBudgetPeriodTimeFrame={setPreviousBudgetPeriodTimeFrame}
        setNextBudgetPeriodTimeFrame={setNextBudgetPeriodTimeFrame}
        unallocatedFunds={unallocatedFunds}
      />
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
