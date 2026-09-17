import { ReactNode, useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';

/**
 * Pressable mit sanftem Scale-Feedback beim Antippen — sorgt für das
 * "lebendige" Gefühl, das rein statische Buttons nicht haben.
 */
export function AnimatedPressable({
  children,
  onPress,
  style,
  disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(0.94)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
