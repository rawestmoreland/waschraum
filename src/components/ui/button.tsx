import { Pressable } from 'react-native';

export const Button = ({
  onPress,
  text,
}: {
  onPress: () => void;
  text: string;
}) => {
  return (
    <Pressable
      style={{
        backgroundColor: 'blue',
        paddingHorizontal: 8,
        paddingVertical: 12,
      }}
      onPress={onPress}
    >
      {text}
    </Pressable>
  );
};
