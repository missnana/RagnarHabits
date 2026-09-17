import { useRouter, usePathname, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/hooks/useColorScheme';
import { radius, spacing } from '../lib/theme';

const NAV_ITEMS: { href: Href; label: string; icon: string }[] = [
  { href: '/', label: 'Eintragen', icon: '🎙️' },
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dog', label: 'Hund', icon: '🐾' },
  { href: '/settings', label: 'Einstellungen', icon: '⚙️' },
];

const HEADER_HEIGHT = 48;

export function AppHeader() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: open ? 1 : 0, useNativeDriver: true, speed: 22, bounciness: 6 }).start();
  }, [open, anim]);

  return (
    <View style={{ paddingTop: insets.top }}>
      <BlurView
        intensity={theme.glassIntensity}
        tint={theme.glassTint}
        style={{
          height: HEADER_HEIGHT,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
        }}
      >
        <Pressable onPress={() => setOpen(true)} hitSlop={8}>
          <Text style={{ fontSize: 22, color: theme.text }}>☰</Text>
        </Pressable>
      </BlurView>
      {/* Weicher Übergang statt harter Kante */}
      <LinearGradient colors={[theme.surfaceBorder, `${theme.background}00`]} style={{ height: 18 }} pointerEvents="none" />

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <Animated.View
            style={{
              position: 'absolute',
              top: insets.top + HEADER_HEIGHT,
              right: spacing.md,
              width: 210,
              borderRadius: radius.md,
              overflow: 'hidden',
              opacity: anim,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
              ],
            }}
          >
            <BlurView
              intensity={theme.glassIntensity + 15}
              tint={theme.glassTint}
              style={{
                borderWidth: 1,
                borderColor: theme.surfaceBorder,
                paddingVertical: spacing.xs,
              }}
            >
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      backgroundColor: active ? theme.surfaceAlt : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    <Text
                      style={{
                        marginLeft: spacing.sm,
                        color: theme.text,
                        fontWeight: active ? '700' : '500',
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </BlurView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
