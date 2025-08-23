import React, { useEffect, useState, useCallback } from 'react';
import { View, SafeAreaView, Text, StyleSheet, FlatList, Button, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import AddCategoryModal from '@/components/budget/AddCategoryModal';
import AssignmentModal from '@/components/budget/AssignmentModal';
import CategoryInfoModal from '@/components/budget/CategoryInfoModal';
import ConfirmationModal from '@/components/budget/ConfirmationModal';
import BudgetTabHeader from '@/components/budget/BudgetTabHeader';
import { deleteCategory } from '@/services/categories';
import { createAssignment } from '@/services/assignments';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';
import { Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetPeriod } from '@/hooks/useBudgetPeriod';
import { useAllocatedAndSpent } from '@/hooks/useAllocatedAndSpent';
import { useCategoryHandlers } from '@/hooks/useCategoryHandlers';
import {
  setPreviousBudgetPeriodTimeFrame,
  setNextBudgetPeriodTimeFrame,
} from '@/utils/dateUtils';

export default function Tab() {
  const { user } = useAuth();
  const { categories, loading, unallocatedFunds } = useCategories();
  const {
    startDate,
    endDate,
    budgetPeriod,
    setStartDate,
    setEndDate,
    setBudgetPeriod,
  } = useBudgetPeriod(user);
  const {
    allocatedAndSpent,
    unallocatedIncome,
    loading: allocatedSpentLoading,
    fetchAllocatedAndSpent,
    getAllocatedAmount,
    getSpentAmount,
    setAllocatedAndSpent,
    setUnallocatedIncome,
  } = useAllocatedAndSpent(user, startDate, endDate);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoCategory, setSelectedInfoCategory] = useState<Category | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fixingCategories, setFixingCategories] = useState<Set<string>>(new Set());

  const {
    handleCategoryNameUpdate,
    handleCategoryGoalUpdate,
  } = useCategoryHandlers({
    fetchAllocatedAndSpent,
    selectedInfoCategory,
    setSelectedInfoCategory,
  });

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
        fetchAllocatedAndSpent();
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

  const handleFixNegativeAvailable = async (category: Category) => {
    if (category.available >= 0) return;
    
    // Check if this category is already being fixed
    if (fixingCategories.has(category.id)) return;
    
    // Add category to fixing set
    setFixingCategories(prev => new Set(prev).add(category.id));
    
    const amountToAllocate = Math.abs(category.available);
    const assignment = {
      amount: amountToAllocate,
      user_id: user?.uid || '',
      category_id: category.id,
      date: formatDateToYYYYMMDD(new Date()),
    };

    // Store the current allocated amount for potential rollback
    const currentAllocated = allocatedAndSpent[category.id]?.allocated || 0;
    const newAllocated = currentAllocated + amountToAllocate;

    // Optimistically update the allocated amount
    setAllocatedAndSpent(prev => ({
      ...prev,
      [category.id]: {
        allocated: newAllocated,
        spent: prev[category.id]?.spent || 0
      }
    }));

    // Optimistically update unallocated income
    setUnallocatedIncome(prev => prev - amountToAllocate);

    try {
      await createAssignment(assignment);
      // No need to fetch allocated and spent since we updated optimistically
    } catch (error) {
      console.error('Error fixing negative available:', error);
      // Revert optimistic updates on error - restore the exact previous state
      setAllocatedAndSpent(prev => ({
        ...prev,
        [category.id]: {
          allocated: currentAllocated,
          spent: prev[category.id]?.spent || 0
        }
      }));
      setUnallocatedIncome(prev => prev + amountToAllocate);
    } finally {
      // Remove category from fixing set after operation completes
      setFixingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category.id);
        return newSet;
      });
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

    // Store the current allocated amount for potential rollback
    const currentAllocated = allocatedAndSpent[category.id]?.allocated || 0;
    const newAllocated = currentAllocated + shortfall;

    // Optimistically update the allocated amount
    setAllocatedAndSpent(prev => ({
      ...prev,
      [category.id]: {
        allocated: newAllocated,
        spent: prev[category.id]?.spent || 0
      }
    }));

    // Optimistically update unallocated income
    setUnallocatedIncome(prev => prev - shortfall);

    try {
      await createAssignment(assignment);
      // No need to fetch allocated and spent since we updated optimistically
    } catch (error) {
      console.error('Error allocating to goal:', error);
      // Revert optimistic updates on error - restore the exact previous state
      setAllocatedAndSpent(prev => ({
        ...prev,
        [category.id]: {
          allocated: currentAllocated,
          spent: prev[category.id]?.spent || 0
        }
      }));
      setUnallocatedIncome(prev => prev + shortfall);
    }
  };

  const renderItem = ({ item }: { item: Category }) => {
    const allocatedAmount = getAllocatedAmount(item.id);
    const spentAmount = getSpentAmount(item.id);
    const hasNegativeAvailable = item.available < 0;
    const hasGoalShortfall = item.goal_amount && allocatedAmount < item.goal_amount;
    const isBeingFixed = fixingCategories.has(item.id);
    
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
            <View style={styles.mainValuesRow}>
              {/* Quick action buttons */}
              {!allocatedSpentLoading && (
                <View style={styles.actionButtons}>
                  {hasNegativeAvailable && !isBeingFixed && (
                    <TouchableOpacity
                      style={styles.fixButton}
                      onPress={() => handleFixNegativeAvailable(item)}
                      accessibilityLabel={`Fix negative available for ${item.name}`}
                    >
                      <Ionicons name="add-circle" size={20} color="#FF6B6B" />
                      <Text style={styles.fixButtonText}>Fix</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isBeingFixed && (
                    <View style={styles.fixingButton}>
                      <Ionicons name="checkmark-circle" size={20} color="#28A745" />
                      <Text style={styles.fixingButtonText}>Fixing...</Text>
                    </View>
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
              )}

              <View style={styles.horizontalValuesContainer}>
                {allocatedSpentLoading ? (
                  <View style={styles.loadingPeriodContainer}>
                    <ActivityIndicator size="small" color="#007BFF" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <View style={styles.periodValuesContainer}>
                    <Text style={[styles.periodLabel]}>This Period:</Text>
                    <Text style={[styles.periodValue, allocatedAmount < 0 && styles.negativeValue]}>Allocated: {allocatedAmount >= 0 ? '$' : '-$'}{Math.abs(allocatedAmount).toFixed(2)}</Text>
                    <Text style={[styles.periodValue]}>Spent: {spentAmount >= 0 ? '$' : '-$'}{Math.abs(spentAmount).toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.totalValueContainer, { borderLeftColor: item.available >= 0 ? '#28A745' : '#DC3545' }]}>
                  <Text style={[
                    styles.totalValue, 
                    item.available > 0 ? styles.positiveValue : (item.available < 0 ? styles.negativeValue : null)
                  ]}>
                    Available: {item.available >= 0 ? '$' : '-$'}{Math.abs(item.available).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
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
        incomeLoading={allocatedSpentLoading}
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
          fetchAllocatedAndSpent();
        }}
      />        
      <AssignmentModal
        visible={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        userId={user?.uid || ''}
        onAssignmentCreated={() => {
          fetchAllocatedAndSpent();
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
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  mainValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  horizontalValuesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  periodValuesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007BFF',
    flex: 1,
    minWidth: 140,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007BFF',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodValue: {
    fontSize: 14,
    color: '#495057',
    marginVertical: 1,
  },
  totalValueContainer: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  negativeValue: {
    color: 'red',
  },
  positiveValue: {
    color: '#28A745',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
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
  fixingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28A745',
  },
  fixingButtonText: {
    color: '#28A745',
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
  loadingContainer: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 44, // Match the height of action buttons
  },
  loadingPeriodContainer: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007BFF',
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '500',
  },
});
