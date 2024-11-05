import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Button, StyleSheet } from 'react-native';

type AddCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  onNewCategory: (newCategory: { id: string; name: string; allocated: number; available: number }) => void;
};

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ visible, onClose, userId, onNewCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (userId) {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-category`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            name: newCategoryName,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newCategory = {
            id: data.category_id,
            name: newCategoryName,
            allocated: 0,
            available: 0,
          };
          onNewCategory(newCategory); // Notify parent component
          setNewCategoryName('');
          onClose();
        } else {
          console.error('Failed to create category', await response.text());
        }
      } catch (error) {
        console.error('Failed to create category', error);
      }
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Add New Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <Button title="Add" onPress={handleAddCategory} />
          <Button title="Cancel" onPress={onClose} />
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
    // backgroundColor: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
