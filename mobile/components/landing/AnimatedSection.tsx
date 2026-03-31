import { useEffect, useRef, useState } from "react";
import { View, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  delay?: number;
  slideUp?: number;
}

/**
 * Fade-in + slide-up animation triggered when the section enters the viewport.
 * Uses IntersectionObserver on web, auto-triggers on native.
 */
export default function AnimatedSection({ children, delay = 0, slideUp = 30 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(slideUp);
  const viewRef = useRef<View>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      // Sur native, animer directement
      opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
      return;
    }

    // Sur web, utiliser IntersectionObserver
    const node = viewRef.current as unknown as HTMLElement;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
          opacity.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
          translateY.value = withDelay(delay, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [triggered]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View ref={viewRef as React.RefObject<Animated.View>} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
