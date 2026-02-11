import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useAppStore } from '@/store/appStore';
import { BUILT_IN_COACHES, type BuiltInCoachId } from '@/src/lib/coaches';
import { useMemo } from 'react';

const DAILY_NUDGES = [
  { text: 'Start with a hook. What are you creating today?', coachId: 'hook' as BuiltInCoachId },
  { text: 'Feeling scattered? Outline your next piece in 30 seconds.', coachId: 'outline' as BuiltInCoachId },
  { text: 'Stuck on something? Let Block Breaker get you moving.', coachId: 'block-breaker' as BuiltInCoachId },
  { text: 'Too many ideas? Clarity cuts through the noise.', coachId: 'clarity' as BuiltInCoachId },
  { text: 'Facing a tough call? Decision makes it simple.', coachId: 'decision' as BuiltInCoachId },
  { text: 'What is one thing you could ship today? Outline it.', coachId: 'outline' as BuiltInCoachId },
  { text: 'Momentum starts with a single sentence. Write a hook.', coachId: 'hook' as BuiltInCoachId },
];

function getDailyNudge() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_NUDGES[dayOfYear % DAILY_NUDGES.length];
}

// Coach icon colors (brand-aligned accents)
const COACH_ICON_COLORS: Record<string, string> = {
  hook: '#6366F1',
  outline: '#818CF8',
  'block-breaker': '#4F46E5',
  clarity: '#7C3AED',
  decision: '#6366F1',
};

function CoachIcon({ coachId }: { coachId: string }) {
  const color = COACH_ICON_COLORS[coachId] ?? theme.colors.accent;
  return (
    <View style={[styles.coachIcon, { backgroundColor: color }]}>
      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan } = useRevenueCat();
  const { user, loading, signOut } = useSupabase();
  const { hasCompletedOnboarding, onboardingLoaded, loadHasCompletedOnboarding } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const dailyNudge = useMemo(() => getDailyNudge(), []);
  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat === true;

  // Load onboarding state and redirect if not completed
  useEffect(() => {
    loadHasCompletedOnboarding();
  }, [loadHasCompletedOnboarding]);

  useEffect(() => {
    if (onboardingLoaded && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [onboardingLoaded, hasCompletedOnboarding, router]);

  const handleSignOut = async () => {
    await signOut();
    await new Promise((r) => setTimeout(r, 150));
    router.replace('/signin');
  };

  const handleBuiltInCoachPress = async (coachId: BuiltInCoachId) => {
    const coach = BUILT_IN_COACHES.find((c) => c.id === coachId);
    if (!coach) return;
    if (coach.proOnly && plan === 'free') {
      if (skipRevenueCat) {
        router.push('/paywall');
        return;
      }
      // Navigate to custom paywall so user always sees pricing (RevenueCat UI can hang on Android)
      router.push('/paywall');
      return;
    }
    router.push(`/catalyst/builtin-${coachId}`);
  };

  const handleCoachesPress = () => {
    if (!user) {
      router.push('/signin');
      return;
    }
    if (plan === 'free') {
      router.push('/paywall');
      return;
    }
    router.push('/coaches' as any);
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredBuiltIn = searchLower
    ? BUILT_IN_COACHES.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
      )
    : BUILT_IN_COACHES;

  if (loading || !onboardingLoaded || (!hasCompletedOnboarding && onboardingLoaded)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const bottomPadding = insets.bottom;
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.md + bottomPadding }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Coach</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleCoachesPress} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Coaches</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/saved' as any)} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Saved</Text>
          </TouchableOpacity>
          {user ? (
            <>
              <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
                <Text style={styles.profileButtonText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => router.push('/signin')} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coaches..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {user?.email && (
          <Text style={styles.userEmail}>Signed in as {user.email}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.nudgeCard}
        activeOpacity={0.8}
        onPress={() => handleBuiltInCoachPress(dailyNudge.coachId)}
      >
        <Ionicons name="bulb-outline" size={20} color={theme.colors.accent} />
        <Text style={styles.nudgeText}>{dailyNudge.text}</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.colors.accent} />
      </TouchableOpacity>

      {/* Built-in Coach Library */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coach Library</Text>
        <View style={styles.coachGrid}>
          {filteredBuiltIn.map((coach) => {
            const isProOnly = coach.proOnly && plan === 'free';
            const isPopular = coach.id === 'hook';
            return (
              <TouchableOpacity
                key={coach.id}
                style={[styles.coachCard, isProOnly && styles.coachCardLocked]}
                onPress={() => handleBuiltInCoachPress(coach.id)}
              >
                <View style={styles.coachCardInner}>
                  <CoachIcon coachId={coach.id} />
                  <View style={styles.coachCardContent}>
                    <View style={styles.coachCardHeader}>
                      <Text style={styles.coachName}>{coach.title}</Text>
                      {isPopular && (
                        <View style={styles.popularPill}>
                          <Text style={styles.popularPillText}>Popular</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.coachDescription} numberOfLines={2}>
                      {coach.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.coachCardFooter}>
                  {coach.proOnly && (
                    <Text style={styles.proBadge}>Pro</Text>
                  )}
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  header: { marginBottom: theme.spacing.xl },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  profileButton: { padding: theme.spacing.xs },
  profileButtonText: { ...theme.typography.bodySmall, color: theme.colors.text },
  signOutButton: { padding: theme.spacing.xs },
  signOutText: { ...theme.typography.bodySmall, color: theme.colors.accent },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  searchIcon: { marginRight: theme.spacing.sm },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },
  userEmail: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accentLightBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  nudgeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    flex: 1,
    fontStyle: 'italic',
  },
  section: { marginBottom: theme.spacing.xl },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  coachGrid: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  coachCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    position: 'relative',
  },
  coachCardLocked: { opacity: 0.85 },
  coachCardInner: {
    flexDirection: 'row',
    flex: 1,
  },
  coachCardContent: { flex: 1, marginLeft: theme.spacing.md },
  coachCardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  coachCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  coachIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularPill: {
    backgroundColor: theme.colors.accentLightBackground,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  popularPillText: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  coachName: { ...theme.typography.h3, color: theme.colors.text },
  coachDescription: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  proBadge: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
});
