import React from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import BankLinkButtonIOS from './BankLinkButtonIOS';
import BankLinkButtonWeb from './BankLinkButtonWeb';

interface TransactionsTabHeaderProps {
  onAddTransactionPress: () => void;
}

const TransactionsTabHeader: React.FC<TransactionsTabHeaderProps> = ({ onAddTransactionPress }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Transactions</Text>
        {Platform.OS === 'web' && <BankLinkButtonWeb />}
        {/* {Platform.OS === 'web' ? <BankLinkButtonWeb /> : Platform.OS === 'ios' ? <BankLinkButtonIOS /> : null} */}
      <Button title="Add Transaction" onPress={onAddTransactionPress} />
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
});

export default TransactionsTabHeader;
