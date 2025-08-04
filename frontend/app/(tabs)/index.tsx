import React, { useEffect, useState, useCallback } from 'react';
import { View, SafeAreaView, Text, StyleSheet, FlatList, Button, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddCategoryModal from '@/components/budget/AddCategoryModal';
import AssignmentModal from '@/components/budget/AssignmentModal';
import CategoryInfoModal from '@/components/budget/CategoryInfoModal';
import ConfirmationModal from '@/components/budget/ConfirmationModal';
import BudgetTabHeader from '@/components/budget/BudgetTabHeader';
import { getAllocated, deleteCategory } from '@/services/categories';
import { createAssignment } from '@/services/assignments';
import { getTransactionsForCategory } from '@/services/transactions';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';
import { Category, Transaction } from '@/types';
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
  const [spentAmounts, setSpentAmounts] = useState<{[categoryId: string]: number}>({});
  const [unallocatedIncome, setUnallocatedIncome] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(''); // Using string dates now
  const [endDate, setEndDate] = useState(''); // Using string dates now
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [budgetPeriod, setBudgetPeriod] = useState(user?.preferences.budget_period);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoCategory, setSelectedInfoCategory] = useState<Category | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        setUnallocatedIncome(data.unallocated_income || 0);
      } catch (error) {
        console.error('Failed to fetch allocated data', error);
      }
    }
  }, [user, startDate, endDate]);

  const calculateSpentAmount = (transactions: Transaction[], startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
    
    // Calculate spent amount: negative amounts are spending, positive amounts are refunds/returns
    const totalSpent = filteredTransactions.reduce((total, transaction) => {
      const amount = parseFloat(transaction.amount.toString());
      // If amount is negative, it's spending (add to total)
      // If amount is positive, it's a refund/return (subtract from total)
      return total + Math.abs(amount) * (amount < 0 ? 1 : -1);
    }, 0);
    
    // Ensure we don't return negative spent amounts
    return Math.max(totalSpent);
  };

  const fetchSpentAmounts = useCallback(async () => {
    if (!user || !startDate || !endDate) return;
    
    const spentData: {[categoryId: string]: number} = {};
    
    // Fetch spending for each category
    await Promise.all(
      categories.map(async (category) => {
        if (category.is_unallocated_funds) return;
        
        try {
          const response = await getTransactionsForCategory(user.uid, category.id);
          const spentAmount = calculateSpentAmount(response.transactions || [], startDate, endDate);
          spentData[category.id] = spentAmount;
        } catch (error) {
          console.error(`Failed to fetch transactions for category ${category.id}:`, error);
          spentData[category.id] = 0;
        }
      })
    );
    
    setSpentAmounts(spentData);
  }, [user, categories, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllocated();
      fetchSpentAmounts();
    }
  }, [fetchAllocated, fetchSpentAmounts]);

  const getAllocatedAmount = (categoryId: string) => {
    const allocation = allocated.find((alloc) => alloc.category_id === categoryId);
    return allocation ? allocation.allocated : 0;
  };

  const handleCategoryDelete = (category: Category) => {
    console.log('Deleting category:', category, user);
    if (user) {
      setCategoryToDelete(category);
      setDeleteConfirmVisible(true);
    }
  };

  const confirmCategoryDelete = async () => {
    if (user && categoryToDelete) {
      try {
        await deleteCategory(user.uid, categoryToDelete.id);
        fetchAllocated();
        fetchSpentAmounts();
        setDeleteConfirmVisible(false);
        setCategoryToDelete(null);
      } catch (error: any) {
        setDeleteConfirmVisible(false);
        setCategoryToDelete(null);
        setErrorMessage(error.message || "This category may have transactions or assignments associated with it.");
        setErrorModalVisible(true);
      }
    }
  };

  const cancelCategoryDelete = () => {
    setDeleteConfirmVisible(false);
    setCategoryToDelete(null);
  };

  const handleCategoryNameUpdate = (categoryId: string, newName: string) => {
    // This will trigger a re-render of the categories from the context
    // The useCategories hook should automatically refresh the categories
    fetchAllocated();
    fetchSpentAmounts();
  };

  const handleCategoryGoalUpdate = (categoryId: string, goalAmount: number | null) => {
    // Update the selected category's goal amount immediately
    if (selectedInfoCategory && selectedInfoCategory.id === categoryId) {
      setSelectedInfoCategory({
        ...selectedInfoCategory,
        goal_amount: goalAmount || undefined
      });
    }
    // Also refresh the categories to ensure everything is in sync
    fetchAllocated();
    fetchSpentAmounts();
  };

  const handleFixNegativeAvailable = async (category: Category) => {
    if (category.available >= 0) return;
    
    const amountToAllocate = Math.abs(category.available);
    const assignment = {
      amount: amountToAllocate,
      user_id: user?.uid || '',
      category_id: category.id,
      date: formatDateToYYYYMMDD(new Date()),
    };

    try {
      await createAssignment(assignment);
      fetchAllocated();
      fetchSpentAmounts();
    } catch (error) {
      console.error('Error fixing negative available:', error);
    }
  };

  const handleAllocateToGoal = async (category: Category) => {
    if (!category.goal_amount) return;
    
    const allocatedAmount = getAllocatedAmount(category.id);
    const shortfall = category.goal_amount - allocatedAmount;
    
    if (shortfall <= 0) return;
    
    const assignment = {
      amount: shortfall,
      user_id: user?.uid || '',
      category_id: category.id,
      date: formatDateToYYYYMMDD(new Date()),
    };

    try {
      await createAssignment(assignment);
      fetchAllocated();
      fetchSpentAmounts();
    } catch (error) {
      console.error('Error allocating to goal:', error);
    }
  };

  const renderItem = ({ item }: { item: Category }) => {
    const allocatedAmount = getAllocatedAmount(item.id);
    const spentAmount = spentAmounts[item.id] || 0;
    const hasNegativeAvailable = item.available < 0;
    const hasGoalShortfall = item.goal_amount && allocatedAmount < item.goal_amount;
    
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
            {/* Quick action buttons */}
            <View style={styles.actionButtons}>
              {hasNegativeAvailable && (
                <TouchableOpacity
                  style={styles.fixButton}
                  onPress={() => handleFixNegativeAvailable(item)}
                  accessibilityLabel={`Fix negative available for ${item.name}`}
                >
                  <Ionicons name="add-circle" size={20} color="#FF6B6B" />
                  <Text style={styles.fixButtonText}>Fix</Text>
                </TouchableOpacity>
              )}
              
              {hasGoalShortfall && (
                <TouchableOpacity
                  style={styles.goalButton}
                  onPress={() => handleAllocateToGoal(item)}
                  accessibilityLabel={`Allocate to goal for ${item.name}`}
                >
                  <Ionicons name="flag" size={20} color="#4ECDC4" />
                  <Text style={styles.goalButtonText}>Goal</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.value}>Allocated: {allocatedAmount >= 0 ? '$' : '-$'}{Math.abs(allocatedAmount).toFixed(2)}</Text>
            {/* <Text style={styles.value}>Spent: ${spentAmount.toFixed(2)}</Text> */}
            <Text style={styles.value}>Spent: {spentAmount >= 0 ? '$' : '-$'}{Math.abs(spentAmount).toFixed(2)}</Text>
            <Text style={[styles.value, item.available < 0 && styles.negativeValue]}>Available: {item.available >= 0 ? '$' : '-$'}{Math.abs(item.available).toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, Platform.OS === 'web' && styles.webDeleteButton]}
          onPress={() => handleCategoryDelete(item)}
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
        unallocatedIncome={unallocatedIncome}
        onAddCategoryPress={() => setModalVisible(true)}
      />
      {categories.length > 0 && (
        <FlatList
          data={categories.filter((category: any) => !category.is_unallocated_funds)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      <AddCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userId={user?.uid}
        onNewCategory={() => {
          fetchAllocated();
          fetchSpentAmounts();
        }}
      />        
      <AssignmentModal
        visible={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        userId={user?.uid || ''}
        onAssignmentCreated={() => {
          fetchAllocated();
          fetchSpentAmounts();
        }}
      />      
      <CategoryInfoModal 
        visible={infoModalVisible}
        category={selectedInfoCategory}
        onClose={() => setInfoModalVisible(false)}
        startDate={startDate}
        endDate={endDate}
        onCategoryNameUpdate={handleCategoryNameUpdate}
        onCategoryGoalUpdate={handleCategoryGoalUpdate}
      />
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="destructive"
        onConfirm={confirmCategoryDelete}
        onCancel={cancelCategoryDelete}
      />
      <ConfirmationModal
        visible={errorModalVisible}
        title="Cannot Delete Category"
        message={errorMessage}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
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
  negativeValue: {
    color: 'red',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 8,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  fixButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F9F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  goalButtonText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
