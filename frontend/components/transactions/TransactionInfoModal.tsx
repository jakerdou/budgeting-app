import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '@/types';

interface TransactionInfoModalProps {
  visible: boolean;
  transaction: Transaction | null;
  category: Category | null;
  onClose: () => void;
}

export default function TransactionInfoModal({ 
  visible, 
  transaction, 
  category,
  onClose 
}: TransactionInfoModalProps) {
  if (!transaction) return null;

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

  const categoryName = category?.name || 'None';
  const isUncategorized = !transaction.category_id;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
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
              <Text style={styles.value}>{transaction.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Amount:</Text>
              <Text style={[
                styles.value,
                styles.amountText,
                parseFloat(transaction.amount.toString()) > 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {formatAmount(parseFloat(transaction.amount.toString()))}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{transaction.date}</Text>
              {/* <Text style={styles.value}>{formatDate(transaction.date)}</Text> */}
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
              <Text style={styles.value}>{transaction.account_name}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Transaction ID:</Text>
              <Text style={styles.value}>{transaction.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={styles.value}>{transaction.user_id}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      web: {
        paddingTop: 20,
      },
      default: {
        paddingTop: 60, // Account for status bar on mobile
      },
    }),
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
    paddingHorizontal: 20,
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
});
