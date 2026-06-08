import { usePocketBase } from '@/lib/pocketbase';
import { useNavigationContainerRef, useRouter, useSegments } from 'expo-router';
import { AuthRecord } from 'pocketbase';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{
  isLoggedIn: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: () => Promise<void>;
  signOut: () => void;
}>({
  isLoggedIn: false,
  isInitialized: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
});

function useProtectedRoute(isInitialized: boolean, user?: AuthRecord) {
  const router = useRouter();
  const segments = useSegments();

  // Check that navigation is all good
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const rootNavRef = useNavigationContainerRef();

  // Set ups a listener to check and see if the navigator is ready.
  useEffect(() => {
    const unsubscribe = rootNavRef?.addListener('state', (event) => {
      setIsNavigationReady(true);
    });
    return function cleanup() {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [rootNavRef.current]);

  useEffect(() => {
    // Navigation isn't set up. Do nothing.
    if (!isNavigationReady) return;
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inGuardedGroup = segments[0] === '(guarded)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && !inGuardedGroup) {
      router.replace('/(guarded)/home');
    }
  }, [user, segments, isNavigationReady, isInitialized]);
}

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const pb = usePocketBase();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<AuthRecord | undefined>();

  const signIn = async (email: string, password: string) => {
    if (!pb) {
      return;
    }
    const resp = await pb
      .collection('users')
      .authWithPassword(email, password)
      .catch((e) => console.error('ERROR LOGGING IN', e));
    setUser(pb.authStore.record);
    setIsLoggedIn(pb.authStore.isValid);
  };

  const signOut = () => {
    pb?.authStore.clear();
    setUser(undefined);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    if (!pb) return;
    setIsLoggedIn(pb.authStore.isValid);
    setUser(pb.authStore.record);
    setIsInitialized(true);
  }, [pb]);

  useProtectedRoute(isInitialized, user);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isInitialized,
        signIn,
        signUp: async () => {},
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
