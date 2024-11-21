import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addTransaction } from '@/services/transactions';
import { Category } from '@/types';

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  user: any;
  categories: Category[];
  onAddTransaction: (newTransaction: any) => void;
};

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose, onAddTransaction, user, categories }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());

  const [category, setCategory] = useState(categories[0]?.name || '');
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    if (categories.length > 0) {
      setCategory(categories[0]?.name || '');
    }
  }, [categories]); // Runs whenever `categories` changes

  const handleAddTransaction = async () => {
    const categoryId = categories.find((cat) => cat.name === category)?.id || '';
    const adjustedAmount = isIncome ? parseFloat(amount) : -1 * parseFloat(amount);
    const data = await addTransaction(user.uid, adjustedAmount, categoryId, name, date.toISOString().split('T')[0] );
    const newTransaction = {
      amount: adjustedAmount,
      category_id: categoryId,
      date: date.toISOString(),
      name,
      type: adjustedAmount < 0 ? 'debit' : 'credit',
      user_id: user.uid,
      id: data.transaction_id
    };
    onAddTransaction(newTransaction);
    setName('');
    setAmount('');
    setDate(new Date());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Add Transaction</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={date.toISOString().split('T')[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
            style={styles.input}
          />
        ) : (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => setDate(selectedDate || date)}
            />
          </View>
        )}
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={styles.input}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
          ))}
        </Picker>
        <View style={styles.toggleContainer}>
          <Text>Expense</Text>
          <Switch
            value={isIncome}
            onValueChange={setIsIncome}
          />
          <Text>Income</Text>
        </View>
        <Button title="Add" onPress={handleAddTransaction} />
        <Button title="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default AddTransactionModal;
