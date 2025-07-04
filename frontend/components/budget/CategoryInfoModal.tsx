import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { Category } from '@/types';
import CategoryGoalTab from './CategoryGoalTab';
import CategoryTransactionsTab from './CategoryTransactionsTab';
import { useAuth } from '@/context/AuthProvider';
import { updateCategoryName } from '@/services/categories';

interface CategoryInfoModalProps {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onCategoryNameUpdate?: (categoryId: string, newName: string) => void;
}

const CategoryInfoModal: React.FC<CategoryInfoModalProps> = ({ visible, category, onClose, startDate, endDate, onCategoryNameUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('goals');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(category?.name || '');
  
  // Update display name when category prop changes - must be before early return
  React.useEffect(() => {
    if (category) {
      setCurrentDisplayName(category.name);
    }
  }, [category?.name]);
  
  if (!category) return null;

  const handleEditNameStart = () => {
    setEditedName(currentDisplayName);
    setIsEditingName(true);
  };

  const handleEditNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleEditNameSave = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    if (editedName.trim() === currentDisplayName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      await updateCategoryName(user?.uid || '', category.id, editedName.trim());
      setCurrentDisplayName(editedName.trim()); // Update local display name immediately
      onCategoryNameUpdate?.(category.id, editedName.trim());
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update category name');
    } finally {
      setIsSavingName(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {isEditingName ? (
                <View style={styles.editingContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    autoFocus
                    onSubmitEditing={handleEditNameSave}
                    placeholder="Category name"
                  />
                  <TouchableOpacity onPress={handleEditNameSave} style={styles.saveButton} disabled={isSavingName}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleEditNameCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{currentDisplayName}</Text>
                  <TouchableOpacity onPress={handleEditNameStart} style={styles.editButton}>
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'goals' && styles.activeTab]} 
              onPress={() => setActiveTab('goals')}
            >
              <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>Transactions</Text>
            </TouchableOpacity>
          </View>
            <View style={styles.content}>
            {activeTab === 'goals' ? (
              <CategoryGoalTab category={category} />
            ) : (
              <CategoryTransactionsTab 
                category={category} 
                userId={user?.uid}
                startDate={startDate}
                endDate={endDate}
              />
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={styles.button} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007BFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'normal',
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CategoryInfoModal;
