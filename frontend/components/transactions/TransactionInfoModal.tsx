import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '@/types';
import { updateTransactionDate } from '@/services/transactions';
import { formatDateToYYYYMMDD } from '@/utils/dateUtils';

interface TransactionInfoModalProps {
  visible: boolean;
  transaction: Transaction | null;
  category: Category | null;
  onClose: () => void;
  onTransactionUpdated?: (updatedTransaction: Transaction) => void;
}

export default function TransactionInfoModal({ 
  visible, 
  transaction, 
  category,
  onClose,
  onTransactionUpdated
}: TransactionInfoModalProps) {
  const [localTransaction, setLocalTransaction] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (transaction) {
      setLocalTransaction({ ...transaction });
    }
  }, [transaction]);

  if (!localTransaction) return null;

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    return amount >= 0 ? `+$${absAmount.toFixed(2)}` : `-$${absAmount.toFixed(2)}`;
  };

  const handleDateChange = async (event: any, selectedDate?: Date) => {
    if (selectedDate && localTransaction) {
      console.log('Selected date:', selectedDate);
      const formattedDate = formatDateToYYYYMMDD(selectedDate);
      console.log('Formatted date:', formattedDate);
      
      if (formattedDate !== localTransaction.date) {
        setIsUpdating(true);
        try {
          await updateTransactionDate(localTransaction.user_id, localTransaction.id, formattedDate);
          
          const updatedTransaction = { ...localTransaction, date: formattedDate };
          setLocalTransaction(updatedTransaction);
          
          // Notify parent component of the update
          if (onTransactionUpdated) {
            onTransactionUpdated(updatedTransaction);
          }
        } catch (error) {
          console.error('Failed to update transaction date:', error);
          // You might want to show an error message to the user here
        } finally {
          setIsUpdating(false);
        }
      }
    }
  };

  const categoryName = category?.name || 'None';
  const isUncategorized = !localTransaction.category_id;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      style={styles.modalContainer}
    >
      <View style={styles.modalView}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{localTransaction.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Amount:</Text>
              <Text style={[
                styles.value,
                styles.amountText,
                parseFloat(localTransaction.amount.toString()) > 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {formatAmount(parseFloat(localTransaction.amount.toString()))}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Date:</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={localTransaction.date}
                  onChange={(e) => {
                    // Use the date string directly instead of creating a Date object
                    // which can cause timezone issues
                    const dateStr = e.target.value;
                    if (dateStr && dateStr !== localTransaction.date) {
                      // Create a Date object for the handleDateChange function
                      // but use local time interpretation to avoid timezone issues
                      const [year, month, day] = dateStr.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      handleDateChange(null, date);
                    }
                  }}
                  // Remove any potential date restrictions
                  min=""
                  max=""
                  style={{ 
                    fontSize: 16,
                    color: '#333',
                    textAlign: 'right',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  disabled={isUpdating}
                />
              ) : (
                <DateTimePicker
                  value={new Date(localTransaction.date)}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  disabled={isUpdating}
                />
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Category:</Text>
              <Text style={[
                styles.value,
                isUncategorized ? styles.uncategorizedText : null
              ]}>
                {categoryName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Account:</Text>
              <Text style={styles.value}>{localTransaction.account_name}</Text>
            </View>

            {localTransaction.merchant_name && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Merchant:</Text>
                <Text style={styles.value}>{localTransaction.merchant_name}</Text>
              </View>
            )}

            {localTransaction.pending !== undefined && localTransaction.pending !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[
                  styles.value,
                  localTransaction.pending ? styles.pendingStatus : styles.completedStatus
                ]}>
                  {localTransaction.pending ? 'Pending' : 'Completed'}
                </Text>
              </View>
            )}

            {localTransaction.personal_finance_category && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Plaid Category:</Text>
                <Text style={styles.value}>
                  {localTransaction.personal_finance_category.primary}
                  {localTransaction.personal_finance_category.detailed && 
                    ` - ${localTransaction.personal_finance_category.detailed.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`
                  }
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Transaction ID:</Text>
              <Text style={styles.value}>{localTransaction.id}</Text>
            </View>

            {/* <View style={styles.infoRow}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={styles.value}>{localTransaction.user_id}</Text>
            </View> */}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0, // Take up full screen
    justifyContent: 'flex-end', // Align to the bottom
  },
  modalView: {
    width: '100%',
    height: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 30, // Added horizontal padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0, // Remove extra padding since modalView has horizontal padding
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0, // Remove horizontal padding since modalView has it
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  amountText: {
    fontWeight: '600',
    fontSize: 18,
  },
  positiveAmount: {
    color: '#28a745',
  },
  negativeAmount: {
    color: '#dc3545',
  },
  uncategorizedText: {
    color: '#bbb',
    fontStyle: 'italic',
  },
  pendingStatus: {
    color: '#ffa500',
    fontWeight: '600',
  },
  completedStatus: {
    color: '#28a745',
    fontWeight: '600',
  },
});
