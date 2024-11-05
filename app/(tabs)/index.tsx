import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, Text, StyleSheet, FlatList, Button } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import AddCategoryModal from '@/components/AddCategoryModal'; // Import the new modal component

type Category = {
  id: string;
  name: string;
  allocated: number;
  available: number;
};

export default function Tab() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [unallocatedFunds, setUnallocatedFunds] = useState<{ name: string; available: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      if (user) {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/get-categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: user.uid }),
          });
          const data = await response.json();
          const unallocated = data.categories.find((category: any) => category.is_unallocated_funds);
          setUnallocatedFunds(unallocated);
          setCategories(data.categories.filter((category: any) => !category.is_unallocated_funds));
        } catch (error) {
          console.error('Failed to fetch categories', error);
        }
      }
    };

    fetchCategories();
  }, [user]);

  const handleNewCategory = (newCategory: Category) => {
    setCategories((prevCategories) => [...prevCategories, newCategory]);
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <View style={styles.valuesContainer}>
        <Text style={styles.value}>Allocated: ${item.allocated}</Text>
        <Text style={styles.value}>Available: ${item.available}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {unallocatedFunds && (
          <>
            <Text style={styles.headerText}>{unallocatedFunds.name}</Text>
            <Text style={styles.headerValue}>${unallocatedFunds.available}</Text>
          </>
        )}
      </View>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<View style={styles.listHeader} />}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button title="Add Category" onPress={() => setModalVisible(true)} />
          </View>
        }
        stickyHeaderIndices={[0]}
      />
      <AddCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userId={user?.uid}
        onNewCategory={handleNewCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listHeader: {
    height: 0, // This is needed to make the sticky header work
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});
