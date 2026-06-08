import { Stack } from 'expo-router';

const GuardedLayout = () => {
  return (
    <Stack>
      <Stack.Screen name='home' />
    </Stack>
  );
};

export default GuardedLayout;
