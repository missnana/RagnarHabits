import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../lib/hooks/useColorScheme';
import { iridescent } from '../lib/theme';

/** Sanft rotierender, verblurrter Farbschimmer — der "iridiszierende" Glow hinter dem Mikro-Button. */
export function IridescentHalo({ size }: { size: number }) {
  const theme = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
      pointerEvents="none"
    >
      <Animated.View style={{ width: size * 1.5, height: size * 1.5, marginLeft: -size * 0.25, marginTop: -size * 0.25, transform: [{ rotate: spin }] }}>
        <LinearGradient
          colors={iridescent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <BlurView intensity={theme.glassIntensity + 20} tint={theme.glassTint} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', overflow: 'hidden' },
});
