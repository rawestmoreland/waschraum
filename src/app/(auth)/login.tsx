import { useAuth } from '@/contexts/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, H1, Input, Text, YStack } from 'tamagui';

const LoginScreen = () => {
  const router = useRouter();

  const { signIn } = useAuth();

  const [email, setEmail] = useState<string | undefined>();
  const [password, setPassword] = useState<string | undefined>();
  const [errorText, setErrorText] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <KeyboardAvoidingView
        behavior='padding'
        keyboardVerticalOffset={100}
        style={{ marginHorizontal: 16 }}
      >
        <YStack items='center' gap='$4'>
          <H1>Login</H1>
          <YStack gap='$2' width='100%'>
            <Input
              value={email}
              autoCapitalize='off'
              type='email'
              onChange={(e) => setEmail(e.target.value)}
              placeholder='email'
            />
            <Input
              type='password'
              autoCapitalize='off'
              onChange={(e) => setPassword(e.target.value)}
              placeholder='password'
            />
            <Button
              onPress={async () => {
                setErrorText('');
                if (!email || !password) {
                  setErrorText('Missing some things');
                  return;
                }
                await signIn(email, password);
              }}
            >
              Login
            </Button>
            <Button
              variant='outlined'
              onPress={() => {
                router.replace('/(auth)/signup');
              }}
            >
              No account?
            </Button>
            {!!errorText && <Text color='$red11'>{errorText}</Text>}
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
