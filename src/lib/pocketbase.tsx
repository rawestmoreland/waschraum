import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, { AsyncAuthStore } from 'pocketbase';
import React, { createContext, useContext, useEffect, useState } from 'react';

const PocketBaseContext = createContext<PocketBase | undefined>(undefined);

export const usePocketBase = (): PocketBase | undefined =>
  useContext(PocketBaseContext);

export const PocketBaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pb, setPb] = useState<PocketBase | undefined>(undefined);

  useEffect(() => {
    const initializePocketBase = async () => {
      // This is where our auth session will be stored. It's PocketBase magic.
      const store = new AsyncAuthStore({
        save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
        initial: (await AsyncStorage.getItem('pb_auth')) ?? undefined,
        clear: async () => AsyncStorage.removeItem('pb_auth'),
      });
      console.log(store);
      const pbInstance = new PocketBase(process.env.EXPO_PUBLIC_PB_URL!, store);
      setPb(pbInstance);
    };

    initializePocketBase();
  }, []);

  return (
    <PocketBaseContext.Provider value={pb}>
      {children}
    </PocketBaseContext.Provider>
  );
};
