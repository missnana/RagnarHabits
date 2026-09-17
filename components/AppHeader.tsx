import { useRouter, usePathname, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
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

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: theme.background }}>
      <View
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
      </View>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: 'absolute',
              top: insets.top + HEADER_HEIGHT,
              right: spacing.md,
              width: 210,
              backgroundColor: theme.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: theme.border,
              paddingVertical: spacing.xs,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
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
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
