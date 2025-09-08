import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { Category } from '@/types';
import CategoryGoalTab from './CategoryGoalTab';
import CategoryTransactionsTab from './CategoryTransactionsTab';
import { useAuth } from '@/context/AuthProvider';
import { useCategories } from '@/context/CategoriesProvider';
import { updateCategoryName, updateCategoryGroup } from '@/services/categories';

interface CategoryInfoModalProps {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onCategoryNameUpdate?: (categoryId: string, newName: string) => void;
  onCategoryGoalUpdate?: (categoryId: string, goalAmount: number | null) => void;
  onCategoryGroupUpdate?: (categoryId: string, groupId: string | null) => void;
}

const CategoryInfoModal: React.FC<CategoryInfoModalProps> = ({ visible, category, onClose, startDate, endDate, onCategoryNameUpdate, onCategoryGoalUpdate, onCategoryGroupUpdate }) => {
  const { user } = useAuth();
  const { categoryGroups } = useCategories();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(category?.name || '');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(category?.group_id || null);
  
  // Update display name and group when category prop changes - must be before early return
  React.useEffect(() => {
    if (category) {
      setCurrentDisplayName(category.name);
      setCurrentGroupId(category.group_id || null);
    }
  }, [category?.name, category?.group_id]);
  
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

  const handleGroupChange = async (groupId: string | null) => {
    if (!category || !user) return;
    
    // Immediately update the local state for instant UI feedback
    setCurrentGroupId(groupId);
    setIsSavingGroup(true);
    
    try {
      await updateCategoryGroup(user.uid, category.id, groupId);
      if (onCategoryGroupUpdate) {
        onCategoryGroupUpdate(category.id, groupId);
      }
    } catch (error) {
      console.error('Error updating category group:', error);
      Alert.alert('Error', 'Failed to update category group');
      // Revert the local state on error
      setCurrentGroupId(category.group_id || null);
    } finally {
      setIsSavingGroup(false);
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
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'info' && styles.activeTab]} 
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>Transactions</Text>
            </TouchableOpacity>
          </View>
            <View style={styles.content}>
            {activeTab === 'info' ? (
              <ScrollView style={styles.infoTabContent}>
                {/* Category Group Dropdown */}
                <View style={styles.groupSection}>
                  <Text style={styles.groupLabel}>Category Group:</Text>
                  <View style={styles.groupDropdownContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupOptions}>
                      <TouchableOpacity
                        style={[
                          styles.groupOption,
                          !currentGroupId && styles.selectedGroupOption
                        ]}
                        onPress={() => handleGroupChange(null)}
                        disabled={isSavingGroup}
                      >
                        <Text style={[
                          styles.groupOptionText,
                          !currentGroupId && styles.selectedGroupOptionText
                        ]}>
                          No Group
                        </Text>
                      </TouchableOpacity>
                      {categoryGroups.map((group) => (
                        <TouchableOpacity
                          key={group.id}
                          style={[
                            styles.groupOption,
                            currentGroupId === group.id && styles.selectedGroupOption
                          ]}
                          onPress={() => handleGroupChange(group.id)}
                          disabled={isSavingGroup}
                        >
                          <Text style={[
                            styles.groupOptionText,
                            currentGroupId === group.id && styles.selectedGroupOptionText
                          ]}>
                            {group.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {isSavingGroup && (
                      <Text style={styles.savingText}>Updating...</Text>
                    )}
                  </View>
                </View>
                
                {/* Goals Section */}
                <CategoryGoalTab 
                  category={category} 
                  onGoalUpdate={onCategoryGoalUpdate}
                />
              </ScrollView>
            ) : (
              <CategoryTransactionsTab 
                category={category} 
                userId={user?.uid}
                startDate={startDate}
                endDate={endDate}
              />
            )}
          </View>
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
    width: '100%',
    height: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingHorizontal: 30, // Added horizontal padding
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  infoTabContent: {
    flex: 1,
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
  groupSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  groupDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupOptions: {
    flex: 1,
  },
  groupOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedGroupOption: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  groupOptionText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  selectedGroupOptionText: {
    color: 'white',
  },
  savingText: {
    fontSize: 12,
    color: '#007BFF',
    fontStyle: 'italic',
    marginLeft: 10,
  },
});

export default CategoryInfoModal;
