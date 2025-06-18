import React, { useEffect, useState, useCallback } from 'react';
import { View, SafeAreaView, Text, StyleSheet, FlatList, Button, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddCategoryModal from '@/components/budget/AddCategoryModal';
import AssignmentModal from '@/components/budget/AssignmentModal';
import CategoryInfoModal from '@/components/budget/CategoryInfoModal';
import BudgetTabHeader from '@/components/budget/BudgetTabHeader';
import { getAllocated, deleteCategory } from '@/services/categories';
import { Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import {
  setMonthlyDates,
  setBiWeeklyDates,
  setYearlyDates,
  setPreviousBudgetPeriodTimeFrame,
  setNextBudgetPeriodTimeFrame,
} from '@/utils/dateUtils';

export default function Tab() {
  const { user } = useAuth();
  const { categories, loading, unallocatedFunds } = useCategories();
  const [allocated, setAllocated] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(''); // Using string dates now
  const [endDate, setEndDate] = useState(''); // Using string dates now
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [budgetPeriod, setBudgetPeriod] = useState(user?.preferences.budget_period);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoCategory, setSelectedInfoCategory] = useState<Category | null>(null);

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
      } catch (error) {
        console.error('Failed to fetch allocated data', error);
      }
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllocated();
    }
  }, [fetchAllocated]);

  const getAllocatedAmount = (categoryId: string) => {
    const allocation = allocated.find((alloc) => alloc.category_id === categoryId);
    return allocation ? allocation.allocated : 0;
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!user) return;

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Are you sure you want to delete "${category.name}"?`);
      if (confirmDelete) {
        try {
          await deleteCategory(user.uid, category.id);
          fetchAllocated();
        } catch (error: any) {
          window.alert(error.message || "Cannot delete category. It may have transactions or assignments associated with it.");
        }
      }
    } else {
      Alert.alert(
        "Delete Category",
        `Are you sure you want to delete "${category.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteCategory(user.uid, category.id);
                fetchAllocated();
              } catch (error: any) {
                Alert.alert(
                  "Cannot Delete Category",
                  error.message || "This category may have transactions or assignments associated with it."
                );
              }
            }
          }
        ]
      );
    }
  };
  const renderItem = ({ item }: { item: Category }) => {
    const allocatedAmount = getAllocatedAmount(item.id);
    return (
      <View style={styles.item}>
        <TouchableOpacity
          style={styles.categoryContent}
          onPress={() => setSelectedCategory(item)}
        >
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {
                setSelectedInfoCategory(item);
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
          <View style={styles.valuesContainer}>
            <Text style={styles.value}>Allocated: ${allocatedAmount.toFixed(2)}</Text>
            <Text style={styles.value}>Available: ${item.available.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, Platform.OS === 'web' && styles.webDeleteButton]}
          onPress={() => handleDeleteCategory(item)}
          role="button"
          aria-label={`Delete ${item.name} category`}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color="red" 
            accessibilityLabel="Delete"
          />
        </TouchableOpacity>
      </View>
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
        />
      )}
      <View style={styles.footer}>
        <Button title="Add Category" onPress={() => setModalVisible(true)} />
      </View>
      <AddCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userId={user?.uid}
        onNewCategory={() => fetchAllocated()}
      />        
      <AssignmentModal
        visible={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        userId={user?.uid || ''}
        onAssignmentCreated={fetchAllocated}
      />      
      <CategoryInfoModal 
        visible={infoModalVisible}
        category={selectedInfoCategory}
        onClose={() => setInfoModalVisible(false)}
        startDate={startDate}
        endDate={endDate}
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
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },  
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});
