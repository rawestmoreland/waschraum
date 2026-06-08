import { TextInput as RNInput } from 'react-native';

export const Input = ({ ...props }) => {
  return <RNInput style={{ borderColor: 'grey' }} {...props} />;
};
