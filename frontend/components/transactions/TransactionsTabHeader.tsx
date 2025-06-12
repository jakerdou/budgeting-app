import React from 'react';
import { View, Text, Button, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import BankLinkButtonIOS from './BankLinkButtonIOS';
import BankLinkButtonWeb from './BankLinkButtonWeb';

interface TransactionsTabHeaderProps {
  onAddTransactionPress: () => void;
  onSyncTransactionsPress: () => void;
  isSyncing?: boolean;
}

const TransactionsTabHeader: React.FC<TransactionsTabHeaderProps> = ({ 
  onAddTransactionPress,
  onSyncTransactionsPress,
  isSyncing = false 
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Transactions</Text>
      <View style={styles.buttonContainer}>
        {Platform.OS === 'web' && <BankLinkButtonWeb />}
        {/* {Platform.OS === 'web' ? <BankLinkButtonWeb /> : Platform.OS === 'ios' ? <BankLinkButtonIOS /> : null} */}
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
          onPress={onSyncTransactionsPress}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Transactions'}
          </Text>
        </TouchableOpacity>
        <Button title="Add Transaction" onPress={onAddTransactionPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TransactionsTabHeader;
