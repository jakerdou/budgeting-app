import { View, Text, StyleSheet, Button, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
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
    <View style={styles.container}>
      {user && <Text>Logged in as: {user.email}</Text>}
      <Button title="Logout" onPress={logout} />
      <Preferences userId={user?.uid} preferences={user?.preferences} />

      {showConfirmation && itemToDelete && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationDialog}>
            <Text style={styles.confirmationTitle}>Confirm Deletion</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to unlink {itemToDelete.name}?
            </Text>
            <View style={styles.confirmationButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowConfirmation(false);
                  setItemToDelete(null);
                }}
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="Delete"
                color="red"
                onPress={() => performDeleteItem(itemToDelete.id, itemToDelete.name)}
              />
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionHeader}>Linked Accounts</Text>
      {plaidItems.length === 0 ? (
        <Text style={styles.noItems}>No linked accounts found</Text>
      ) : (
        <FlatList
          data={plaidItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.name}>{item.institution_name}</Text>
              {isDeleting && deleteItemId === item.id ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : (
                <Button
                  title="Unlink"
                  color="red"
                  onPress={() => handleDeleteItem(item.id, item.institution_name)}
                  disabled={isDeleting}
                />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    color: '#666',
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
});
