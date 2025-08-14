import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native';
import Modal from 'react-native-modal'; // Importing react-native-modal
import { addCategory } from '@/services/categories';

type AddCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  onNewCategory: (newCategory: { id: string; name: string; allocated: number; available: number }) => void;
};

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ visible, onClose, userId, onNewCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const nameInputRef = useRef<TextInput>(null);

  // Focus the input when the modal becomes visible
  useEffect(() => {
    if (visible && nameInputRef.current) {
      // Add a small delay to ensure the modal animation completes before focusing
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (!visible) {
      // Clear the input when modal is closed
      setNewCategoryName('');
    }
  }, [visible]);

  const handleAddCategory = async () => {
    if (userId) {
      const data = await addCategory(userId, newCategoryName);
      const newCategory = {
        id: data.category_id,
        name: newCategoryName,
        allocated: 0,
        available: 0,
      };
      onNewCategory(newCategory); // Notify parent component
      onClose(); // Input will be cleared by useEffect when modal closes
    }
  };

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
        <Text style={styles.modalText}>Add New Category</Text>
        <TextInput
          ref={nameInputRef}
          style={styles.input}
          placeholder="Category Name"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          autoFocus={Platform.OS === 'web'} // For web, use autoFocus
        />
        <Button title="Add" onPress={handleAddCategory} />
        <Button title="Cancel" onPress={onClose} />
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

export default AddCategoryModal;
