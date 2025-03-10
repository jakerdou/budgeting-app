import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import Preferences from '@/components/profile/Preferences';

export default function Tab() {
  const { user, logout } = useAuth();
  
  return (
    <View style={styles.container}>
      {user && <Text>Logged in as: {user.email}</Text>}
      <Button title="Logout" onPress={logout} />
      <Preferences userId={user?.uid} preferences={user?.preferences} />
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
