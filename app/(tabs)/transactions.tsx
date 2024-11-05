import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';
import { useAuth } from '@/context/AuthProvider';

export default function Tab() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (user) {
        try {
          const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/get-transactions`, {
            user_id: user.uid,
          });
          setTransactions(response.data.transactions);
        } catch (error) {
          console.error('Failed to fetch transactions', error);
        }
      }
    };

    fetchTransactions();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text>Transactions Tab</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name} {item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
