import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function TabIcon({ color, focused, name, selectedName }: {
  color: ColorValue;
  focused: boolean;
  name: IconName;
  selectedName: IconName;
}) {
  return <Ionicons color={color} name={focused ? selectedName : name} size={22} />;
}
