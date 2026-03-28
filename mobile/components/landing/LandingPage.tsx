import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, View, Platform } from "react-native";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";

import LandingShowcase from "./LandingShowcase";
import LandingFeatures from "./LandingFeatures";
import LandingPricing from "./LandingPricing";
import LandingContact from "./LandingContact";
import LandingCTA from "./LandingCTA";
import LandingFooter from "./LandingFooter";
import AnimatedSection from "./AnimatedSection";
import { useResponsive } from "@/lib/hooks/useResponsive";

export default function LandingPage() {
  const { isMobile } = useResponsive();
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  const handleScrollTo = useCallback((section: string) => {
    const sectionView = sectionRefs.current[section];
    if (!sectionView) return;

    if (Platform.OS === "web") {
      const node = sectionView as unknown as HTMLElement;
      node?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    } else {
      (sectionView as any).measureLayout?.(
        scrollRef.current,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y, animated: true });
        },
        () => {}
      );
    }
  }, []);

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <LandingHeader isMobile={isMobile} onScrollTo={handleScrollTo} />

      <AnimatedSection delay={100}>
        <LandingHero isMobile={isMobile} loaded={loaded} />
      </AnimatedSection>

      <AnimatedSection delay={0}>
        <LandingShowcase isMobile={isMobile} />
      </AnimatedSection>

      <View ref={(r) => { sectionRefs.current.features = r; }}>
        <AnimatedSection delay={0}>
          <LandingFeatures isMobile={isMobile} loaded={loaded} />
        </AnimatedSection>
      </View>

      <View ref={(r) => { sectionRefs.current.tarifs = r; }}>
        <AnimatedSection delay={0}>
          <LandingPricing isMobile={isMobile} />
        </AnimatedSection>
      </View>

      <View ref={(r) => { sectionRefs.current.contact = r; }}>
        <AnimatedSection delay={0}>
          <LandingContact isMobile={isMobile} />
        </AnimatedSection>
      </View>

      <View ref={(r) => { sectionRefs.current.assistant = r; }}>
        <AnimatedSection delay={0}>
          <LandingCTA />
        </AnimatedSection>
      </View>

      <AnimatedSection delay={0}>
        <LandingFooter isMobile={isMobile} onScrollTo={handleScrollTo} />
      </AnimatedSection>
    </ScrollView>
  );
}
