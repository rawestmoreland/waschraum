import { useAuth } from '@/contexts/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, View } from 'tamagui';

const HomeScreen = () => {
  const { signOut } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <View style={{ marginHorizontal: 16 }}>
        <Text>Home</Text>
        <Button onPress={signOut}>Log out</Button>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
