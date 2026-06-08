import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, H1, Input, Text, YStack } from 'tamagui';

const SignupScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string | undefined>();
  const [password, setPassword] = useState<string | undefined>();
  const [confirmPassword, setConfirmPassword] = useState<string | undefined>();
  const [errorText, setErrorText] = useState<string | undefined>();

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <KeyboardAvoidingView
        behavior='padding'
        keyboardVerticalOffset={100}
        style={{ marginHorizontal: 16 }}
      >
        <YStack items='center' gap='$4'>
          <H1>Sign Up</H1>
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
            <Input
              type='password'
              autoCapitalize='off'
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
              placeholder='password'
            />
            <Button
              onPress={() => {
                setErrorText(undefined);
                if (!email || !password || !confirmPassword) {
                  setErrorText("You're missing something");
                  return;
                }
                if (confirmPassword !== password) {
                  setErrorText('Your passwords do not match');
                  return;
                }
              }}
            >
              Sign Up
            </Button>
            <Button
              variant='outlined'
              onPress={() => {
                router.replace('/(auth)/login');
              }}
            >
              Have an account?
            </Button>
            {!!errorText && <Text color='$red11'>{errorText}</Text>}
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
