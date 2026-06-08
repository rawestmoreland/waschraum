import { useAuth } from '@/contexts/auth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoggedIn, isInitialized } = useAuth();

  if (!isInitialized) return null;

  if (isLoggedIn) {
    return <Redirect href='/(guarded)/home' />;
  }

  return <Redirect href='/(auth)/login' />;
}
