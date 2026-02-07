import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppStore } from '@/store/appStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    icon: 'sparkles' as const,
    title: 'Transform Advice into Action',
    description: 'Minimalist AI coaching in your pocket. Get guidance at the right moment—not endless chat.',
  },
  {
    key: '2',
    icon: 'people' as const,
    title: 'Pick a Coach, Get Results',
    description: 'Hook, Outline, Block Breaker, Clarity, Decision. Choose your coach, add context, and get actionable output in seconds.',
  },
  {
    key: '3',
    icon: 'arrow-forward' as const,
    title: 'Start Creating',
    description: 'Sign in to save your runs, create custom coaches, and unlock Pro features.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const setHasCompletedOnboarding = useAppStore(
    (state) => state.setHasCompletedOnboarding
  );

  const handleNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      const next = slideIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setSlideIndex(next);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    router.replace('/');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      setSlideIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderSlide = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={56} color={theme.colors.accent} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(item) => item.key}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>
            {slideIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
        {slideIndex === SLIDES.length - 1 && (
          <Link href="/paywall" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>View Plans</Text>
            </TouchableOpacity>
          </Link>
        )}

        <View style={styles.stepper}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepperDot,
                i === slideIndex && styles.stepperDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.accentLightBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  stepperDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
});
