import { Stack } from 'expo-router';

import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui, TamaguiProvider } from '@tamagui/core';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AuthProvider from '@/contexts/auth';
import { PocketBaseProvider } from '@/lib/pocketbase';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// you usually export this from a tamagui.config.ts file
const config = createTamagui(defaultConfig);

type Conf = typeof config;

// make imports typed
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export default function TabLayout() {
  return (
    <PocketBaseProvider>
      <AuthProvider>
        <KeyboardProvider>
          <TamaguiProvider config={config} defaultTheme='light'>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name='(guarded)' />
            </Stack>
          </TamaguiProvider>
        </KeyboardProvider>
      </AuthProvider>
    </PocketBaseProvider>
  );
}
