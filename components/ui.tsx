import { ReactNode, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from './AnimatedPressable';
import { useTheme } from '../lib/hooks/useColorScheme';
import { radius, spacing, typography } from '../lib/theme';

export function Screen({
  children,
  edges = ['top'],
  background = true,
}: {
  children: ReactNode;
  edges?: Edge[];
  /** false wenn ein umgebendes Layout (z. B. AppLayout) den Verlauf schon zeichnet */
  background?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      {background && (
        <LinearGradient
          colors={theme.backgroundGradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
      )}
      <SafeAreaView style={styles.screen} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={[typography.display, { color: theme.text, margin: spacing.md }]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <BlurView
      intensity={theme.glassIntensity}
      tint={theme.glassTint}
      style={[styles.card, { borderColor: theme.surfaceBorder, backgroundColor: theme.surface }, style]}
    >
      {children}
    </BlurView>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
}) {
  const theme = useTheme();
  const bg =
    variant === 'primary'
      ? theme.primary
      : variant === 'accent'
        ? theme.accent
        : variant === 'danger'
          ? theme.danger
          : theme.surfaceAlt;
  const fg = variant === 'accent' ? theme.accentText : variant === 'secondary' ? theme.text : theme.primaryText;

  return (
    <AnimatedPressable onPress={disabled || loading ? undefined : onPress} disabled={disabled || loading}>
      <View style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}>
        {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>}
      </View>
    </AnimatedPressable>
  );
}

export function FormInput(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      style={[
        styles.input,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
      ]}
      {...props}
    />
  );
}

export function CategoryPill({
  label,
  icon,
  color,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <AnimatedPressable onPress={onPress} style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: selected ? color : theme.surfaceAlt,
            borderColor: selected ? color : theme.border,
          },
        ]}
      >
        <Text style={{ fontSize: 15 }}>{icon}</Text>
        <Text
          style={{
            marginLeft: spacing.xs,
            color: selected ? theme.primaryText : theme.text,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, alignItems: 'flex-start' }}>
      <Text style={[typography.title, { color: color ?? theme.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
