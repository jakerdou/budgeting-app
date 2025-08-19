import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import DatePickers from '@/components/budget/DatePickers';
import CategoryInfoModal from '@/components/budget/CategoryInfoModal';
import { getAllocatedAndSpent } from '@/services/categories';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import {
  setMonthlyDates,
  setBiWeeklyDates,
  setYearlyDates,
  setPreviousBudgetPeriodTimeFrame,
  setNextBudgetPeriodTimeFrame,
} from '@/utils/dateUtils';

export default function InsightsScreen() {
  const { user } = useAuth();
  const { categories, loading, unallocatedFunds } = useCategories();
  const [allocatedAndSpent, setAllocatedAndSpent] = useState<{[categoryId: string]: {allocated: number, spent: number}}>({});
  const [unallocatedIncome, setUnallocatedIncome] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState(user?.preferences.budget_period);
  const [allocatedSpentLoading, setAllocatedSpentLoading] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedInfoCategory, setSelectedInfoCategory] = useState<any>(null);

  useEffect(() => {
    if (budgetPeriod === 'monthly') {
      setMonthlyDates(setStartDate, setEndDate);
    } else if (budgetPeriod === 'bi-weekly') {
      setBiWeeklyDates(user?.preferences.pay_schedule || {}, setStartDate, setEndDate);
    } else if (budgetPeriod === 'yearly') {
      setYearlyDates(setStartDate, setEndDate);
    }
  }, [budgetPeriod, user]);

  const fetchAllocatedAndSpent = useCallback(async () => {
    if (user) {
      try {
        setAllocatedSpentLoading(true);
        const data = await getAllocatedAndSpent(user.uid, startDate, endDate);
        
        // Transform the array response into an object keyed by category_id
        const transformedData: {[categoryId: string]: {allocated: number, spent: number}} = {};
        data.allocated_and_spent?.forEach((item: any) => {
          transformedData[item.category_id] = {
            allocated: item.allocated,
            spent: item.spent
          };
        });
        
        setAllocatedAndSpent(transformedData);
        setUnallocatedIncome(data.unallocated_income || 0);
      } catch (error) {
        console.error('Failed to fetch allocated and spent data', error);
      } finally {
        setAllocatedSpentLoading(false);
      }
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllocatedAndSpent();
    }
  }, [fetchAllocatedAndSpent]);

  const getSpentAmount = (categoryId: string) => {
    return allocatedAndSpent[categoryId]?.spent || 0;
  };

  const handleCategoryNameUpdate = (categoryId: string, newName: string) => {
    // This will trigger a re-render of the categories from the context
    // The useCategories hook should automatically refresh the categories
    fetchAllocatedAndSpent();
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
    fetchAllocatedAndSpent();
  };

  const totalSpent = Object.values(allocatedAndSpent).reduce((sum, item) => sum + item.spent, 0);

  // Get spending by category with category names
  const spendingByCategory = categories
    .filter(category => !category.is_unallocated_funds) // Exclude unallocated funds from spending
    .map(category => ({
      id: category.id,
      name: category.name,
      spent: getSpentAmount(category.id),
      percentage: (getSpentAmount(category.id) / totalSpent) * 100
    }))
    // .filter(item => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Prepare chart data - limit to top 8 categories for readability
  const chartData = spendingByCategory.slice(0, 8);
  const screenWidth = Dimensions.get('window').width;
  
  const chartConfig = {
    backgroundColor: 'rgb(0, 122, 255)',
    // backgroundColor: '#ffffff',
    // backgroundGradientFrom: 'rgb(0, 122, 255)',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  const barChartData = {
    labels: chartData.map(item => 
      item.name
    //   item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name
    ),
    datasets: [
      {
        data: chartData.map(item => item.spent),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.datePickersContainer}>
            <DatePickers
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              preferences={user?.preferences}
              setBudgetPeriod={setBudgetPeriod}
              budgetPeriod={budgetPeriod}
              setPreviousBudgetPeriodTimeFrame={setPreviousBudgetPeriodTimeFrame}
              setNextBudgetPeriodTimeFrame={setNextBudgetPeriodTimeFrame}
            />
          </View>
        </View>

        {allocatedSpentLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Loading insights...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Spending Insights</Text>
            
            {/* Income vs Spending Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Income</Text>
                <Text style={styles.incomeAmount}>${unallocatedIncome.toFixed(2)}</Text>
                <Text style={styles.summarySubtitle}>Transactions to Unallocated</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Spending</Text>
                <Text style={styles.spendingAmount}>${totalSpent.toFixed(2)}</Text>
                <Text style={styles.summarySubtitle}>All Categories</Text>
              </View>
            </View>

            {/* Net Cash Flow */}
            <View style={[styles.totalCard, { backgroundColor: unallocatedIncome - totalSpent >= 0 ? '#e8f5e8' : '#ffeaea' }]}>
              <Text style={styles.totalTitle}>Net Cash Flow</Text>
              <Text style={[
                styles.totalAmount, 
                { color: unallocatedIncome - totalSpent >= 0 ? '#2e7d32' : '#d32f2f' }
              ]}>
                {unallocatedIncome - totalSpent >= 0 ? '+' : ''}${(unallocatedIncome - totalSpent).toFixed(2)}
              </Text>
            </View>

            {/* Spending Chart */}
            {chartData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Spending by Category</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={barChartData}
                    width={screenWidth / 2 - 32} // Account for padding
                    height={220}
                    chartConfig={chartConfig}
                  //   verticalLabelRotation={30}
                    fromZero={true}
                    showBarTops={false}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    style={{
                      borderRadius: 16,
                    }}
                    showValuesOnTopOfBars={true}
                  />
                </View>
              </View>
            )}

            {/* Spending by Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              {spendingByCategory.length > 0 ? (
                spendingByCategory.map((item, index) => {
                  const category = categories.find(cat => cat.id === item.id);
                  return (
                    <View key={item.id} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <View style={styles.categoryNameContainer}>
                          <Text style={styles.categoryName}>{item.name}</Text>
                          {category && (
                            <TouchableOpacity 
                              style={styles.infoButton}
                              onPress={() => {
                                setSelectedInfoCategory(category);
                                setInfoModalVisible(true);
                              }}
                              accessibilityLabel={`Show info for ${item.name}`}
                            >
                              <Ionicons 
                                name="information-circle-outline" 
                                size={20} 
                                color="#007BFF" 
                                accessibilityLabel="Info"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.categoryAmount}>${item.spent.toFixed(2)}</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { width: `${item.percentage}%` }]} 
                        />
                      </View>
                      <Text style={styles.percentage}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>
                  {loading ? 'Loading...' : 'No spending data for this period'}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      <CategoryInfoModal 
        visible={infoModalVisible}
        category={selectedInfoCategory}
        onClose={() => setInfoModalVisible(false)}
        startDate={startDate}
        endDate={endDate}
        onCategoryNameUpdate={handleCategoryNameUpdate}
        onCategoryGoalUpdate={handleCategoryGoalUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  datePickersContainer: {
    // DatePickers component has its own styling
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  incomeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  spendingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#888',
  },
  totalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  totalTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
  },
  categoryItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#007BFF',
    fontWeight: '500',
  },
});
