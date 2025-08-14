import { View, Text, StyleSheet, Button, FlatList, Alert, ActivityIndicator, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import Preferences from '@/components/profile/Preferences';
import { useEffect, useState } from 'react';
import { getPlaidItems, deletePlaidItem } from '@/services/plaid_items';
import { PlaidItem } from '@/types';

export default function Tab() {
  const { user, logout } = useAuth();
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchPlaidItems = async () => {
    if (user) {
      try {
        const items: PlaidItem[] = await getPlaidItems(user.uid);
        setPlaidItems(items);
      } catch (error) {
        console.error('Failed to fetch Plaid items', error);
      }
    }
  };

  useEffect(() => {
    fetchPlaidItems();
  }, [user]);

  const handleDeleteItem = async (itemId: string, institutionName: string) => {
    console.log(`Attempting to delete item: ${itemId} (${institutionName})`);

    if (Platform.OS === 'web') {
      setItemToDelete({ id: itemId, name: institutionName });
      setShowConfirmation(true);
    } else {
      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to unlink ${institutionName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDeleteItem(itemId, institutionName),
          },
        ]
      );
    }
  };

  const performDeleteItem = async (itemId: string, institutionName: string) => {
    console.log('Delete confirmed, proceeding with deletion');
    setIsDeleting(true);
    setDeleteItemId(itemId);

    try {
      console.log(`Calling deletePlaidItem with ID: ${itemId}`);
      const result = await deletePlaidItem(itemId);
      console.log('Delete API response:', result);

      await fetchPlaidItems();

      if (Platform.OS === 'web') {
        console.log(`${institutionName} has been unlinked successfully.`);
      } else {
        Alert.alert('Success', `${institutionName} has been unlinked successfully.`);
      }
    } catch (error) {
      console.error('Failed to delete Plaid item', error);

      if (Platform.OS === 'web') {
        console.error(`Failed to unlink account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } else {
        Alert.alert('Error', `Failed to unlink account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsDeleting(false);
      setDeleteItemId(null);
      setShowConfirmation(false);
      setItemToDelete(null);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Profile</Text>
          <View style={styles.sectionContent}>
            {user && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileText}>Logged in as: {user.email}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.sectionContent}>
            <Preferences userId={user?.uid} preferences={user?.preferences} />
          </View>
        </View>

        {/* Linked Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Linked Accounts</Text>
          <View style={styles.sectionContent}>
            {plaidItems.length === 0 ? (
              <Text style={styles.noItems}>No linked accounts found</Text>
            ) : (
              <FlatList
                data={plaidItems}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.item}>
                    <Text style={styles.name}>{item.institution_name}</Text>
                    {isDeleting && deleteItemId === item.id ? (
                      <ActivityIndicator size="small" color="#0000ff" />
                    ) : (
                      <TouchableOpacity
                        style={styles.unlinkButton}
                        onPress={() => handleDeleteItem(item.id, item.institution_name)}
                        disabled={isDeleting}
                      >
                        <Text style={styles.unlinkButtonText}>Unlink</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>

        {showConfirmation && itemToDelete && (
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationDialog}>
              <Text style={styles.confirmationTitle}>Confirm Deletion</Text>
              <Text style={styles.confirmationMessage}>
                Are you sure you want to unlink {itemToDelete.name}?
              </Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowConfirmation(false);
                    setItemToDelete(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.buttonSpacer} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => performDeleteItem(itemToDelete.id, itemToDelete.name)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 8,
  },
  profileInfo: {
    marginBottom: 16,
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  noItems: {
    marginTop: 20,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmationDialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmationMessage: {
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonSpacer: {
    width: 10,
  },
  logoutButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 120,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unlinkButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 60,
  },
  unlinkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
