import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Button, TextInput, StyleSheet } from 'react-native';

type AssignmentModalProps = {
  visible: boolean;
  onClose: () => void;
  category: { id: string; name: string; allocated: number; available: number } | null;
  userId: string;
  // fetchCategories: () => void;
};

const AssignmentModal: React.FC<AssignmentModalProps> = ({ visible, onClose, category, userId }) => {
// const AssignmentModal: React.FC<AssignmentModalProps> = ({ visible, onClose, category, userId, fetchCategories }) => {
  const [amount, setAmount] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setAmount('');
      inputRef.current?.focus();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!category) return;

    const assignment = {
      amount: parseFloat(amount),
      user_id: userId,
      category_id: category.id,
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });

      if (response.ok) {
        setAmount('');
        // fetchCategories();
        onClose();
      } else {
        console.error('Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment', error);
    }
  };

  if (!category) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Assign to {category.name}</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Button title="Submit" onPress={handleSubmit} />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default AssignmentModal;
