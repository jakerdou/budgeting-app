import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native';
import Modal from 'react-native-modal';
import { createCategoryGroup } from '@/services/category_groups';

type AddCategoryGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  onNewCategoryGroup: () => void;
};

const AddCategoryGroupModal: React.FC<AddCategoryGroupModalProps> = ({ visible, onClose, userId, onNewCategoryGroup }) => {
  const [newGroupName, setNewGroupName] = useState('');
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
      setNewGroupName('');
    }
  }, [visible]);

  const handleAddCategoryGroup = async () => {
    if (userId && newGroupName.trim()) {
      try {
        await createCategoryGroup(userId, newGroupName.trim());
        onNewCategoryGroup(); // Notify parent component
        onClose(); // Input will be cleared by useEffect when modal closes
      } catch (error) {
        console.error('Error creating category group:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  const isAddDisabled = !newGroupName.trim();

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      useNativeDriver={true}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Add Category Group</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Group Name:</Text>
          <TextInput
            ref={nameInputRef}
            style={styles.input}
            placeholder="Enter group name"
            value={newGroupName}
            onChangeText={setNewGroupName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleAddCategoryGroup}
            maxLength={50}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onClose}
            color="#6c757d"
          />
          <Button
            title="Add Group"
            onPress={handleAddCategoryGroup}
            disabled={isAddDisabled}
            color={isAddDisabled ? "#6c757d" : "#007BFF"}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    minHeight: 200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default AddCategoryGroupModal;
