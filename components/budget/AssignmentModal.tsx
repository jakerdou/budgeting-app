import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import Modal from 'react-native-modal'; // Importing react-native-modal
import { createAssignment } from '@/services/categories';

type AssignmentModalProps = {
  visible: boolean;
  onClose: () => void;
  category: { id: string; name: string; allocated: number; available: number } | null;
  userId: string;
  // fetchCategories: () => void;
};

const AssignmentModal: React.FC<AssignmentModalProps> = ({ visible, onClose, category, userId }) => {
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
      await createAssignment(assignment);
      setAmount('');
      // fetchCategories();
      onClose();
    } catch (error) {
      console.error('Error creating assignment', error);
    }
  };

  if (!category) return null;

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
        <Text style={styles.modalText}>Assign to {category.name}</Text>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0, // Take up full screen
    justifyContent: 'flex-end', // Align to the bottom
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    height: '75%', // Adjust this to take up the desired height
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default AssignmentModal;
