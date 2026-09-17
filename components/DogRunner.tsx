import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/hooks/useColorScheme';

const PARTICLE_COUNT = 9;
const BAND_HEIGHT = 70;
const BAND_TOP = '16%';

function isDachshundLike(breed?: string | null) {
  if (!breed) return true; // Default: Dackel
  return /dackel|dachshund|teckel/i.test(breed);
}

/** Sehr abstrahierte, absichtlich einfache Silhouette — sie wird eh verblurred. */
function DogShape({ long, color }: { long: boolean; color: string }) {
  const bodyWidth = long ? 92 : 60;
  const bodyHeight = long ? 22 : 36;
  return (
    <View style={{ width: bodyWidth + 34, height: 56, justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          right: 12,
          top: long ? 6 : 0,
          width: 14,
          height: 18,
          borderRadius: 7,
          backgroundColor: color,
          transform: [{ rotate: '25deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 2,
          top: long ? 4 : -2,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: color,
        }}
      />
      <View style={{ width: bodyWidth, height: bodyHeight, borderRadius: bodyHeight / 2, backgroundColor: color }} />
      <View
        style={{
          marginTop: -4,
          width: bodyWidth - 12,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          bottom: long ? 8 : 12,
          width: 16,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          transform: [{ rotate: '-20deg' }],
        }}
      />
    </View>
  );
}

/**
 * Läuft im Hintergrund des Eintragen-Screens über den Bildschirm, bleibt ab
 * und zu stehen und rennt weiter. Sobald `running` false wird (Aufnahme
 * gestartet), zerstreut sie sich Patronus-artig in Partikeln.
 */
export function DogRunner({ breed, running }: { breed?: string | null; running: boolean }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const long = isDachshundLike(breed);

  const x = useRef(new Animated.Value(-80)).current;
  const dogOpacity = useRef(new Animated.Value(1)).current;
  const dogScale = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      dx: new Animated.Value(0),
      dy: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (!running) return;
    x.setValue(-80);
    dogOpacity.setValue(1);
    dogScale.setValue(1);
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: width * 0.3, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(x, { toValue: width * 0.65, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(650),
        Animated.timing(x, { toValue: width + 80, duration: 1300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(x, { toValue: -80, duration: 0, useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [running, width, x, dogOpacity, dogScale]);

  useEffect(() => {
    if (running) return;
    loopRef.current?.stop();
    setShowParticles(true);
    particles.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 36 + Math.random() * 40;
      p.dx.setValue(0);
      p.dy.setValue(0);
      p.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(p.dx, { toValue: Math.cos(angle) * distance, duration: 600, useNativeDriver: true }),
        Animated.timing(p.dy, { toValue: Math.sin(angle) * distance, duration: 600, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 600, delay: 60, useNativeDriver: true }),
      ]).start();
    });
    Animated.parallel([
      Animated.timing(dogOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(dogScale, { toValue: 1.5, duration: 500, useNativeDriver: true }),
    ]).start(() => setShowParticles(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <View style={styles.band} pointerEvents="none">
      <Animated.View style={{ position: 'absolute', top: 8, left: 0, transform: [{ translateX: x }] }}>
        <Animated.View
          style={{
            width: 150,
            height: 56,
            borderRadius: 28,
            overflow: 'hidden',
            opacity: dogOpacity,
            transform: [{ scale: dogScale }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={[`${theme.accent}00`, `${theme.accent}55`, `${theme.accent}00`]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ width: 90, height: 8, borderRadius: 4, marginRight: -22 }}
            />
            <DogShape long={long} color={theme.text} />
          </View>
          <BlurView intensity={18} tint={theme.glassTint} style={StyleSheet.absoluteFill} pointerEvents="none" />
        </Animated.View>

        {showParticles &&
          particles.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                top: 24,
                left: 18,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.accent,
                opacity: p.opacity,
                transform: [{ translateX: p.dx }, { translateY: p.dy }],
              }}
            />
          ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    top: BAND_TOP,
    left: 0,
    right: 0,
    height: BAND_HEIGHT,
    overflow: 'hidden',
  },
});
