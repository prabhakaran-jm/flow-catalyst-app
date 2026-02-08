import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useAppStore } from '@/store/appStore';
import { fetchCatalysts, deleteCatalyst, Catalyst } from '@/src/lib/api';
import { showAlert, showConfirm } from '@/src/lib/alert';
import { BUILT_IN_COACHES, type BuiltInCoachId } from '@/src/lib/coaches';

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
  const { plan, setPlanForTesting } = useRevenueCat();
  const { user, loading, signOut } = useSupabase();
  const { savedResults, loadSavedResults, deleteSavedResult } = useAppStore();
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loadingCatalysts, setLoadingCatalysts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCatalysts = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingCatalysts(true);
      const data = await fetchCatalysts();
      setCatalysts(data);
    } catch (error) {
      console.error('Failed to load catalysts:', error);
    } finally {
      setLoadingCatalysts(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSavedResults();
      if (user) loadCatalysts();
    }, [user, loadCatalysts, loadSavedResults])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCatalysts();
    setRefreshing(false);
  }, [loadCatalysts]);

  const handleCreatePress = () => {
    if (!user) {
      showAlert('Sign in to create', 'Sign in to save and create your own coaches.');
      router.push('/signin');
      return;
    }
    if (plan === 'free' && !skipRevenueCat) {
      router.push('/paywall');
    } else {
      router.push('/catalyst/create');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await new Promise((r) => setTimeout(r, 150));
    router.replace('/signin');
  };

  const handleBuiltInCoachPress = (coachId: BuiltInCoachId) => {
    const coach = BUILT_IN_COACHES.find((c) => c.id === coachId);
    if (!coach) return;
    if (coach.proOnly && plan === 'free' && !skipRevenueCat) {
      router.push('/paywall');
    } else {
      router.push(`/catalyst/builtin-${coachId}`);
    }
  };

  const handleCatalystPress = (catalystId: string) => {
    if (!user) {
      showAlert('Sign in to run', 'Sign in to run your saved coaches.');
      router.push('/signin');
      return;
    }
    if (plan === 'free' && !skipRevenueCat) {
      router.push('/paywall');
    } else {
      router.push(`/catalyst/${catalystId}`);
    }
  };

  const handleEditPress = (e: any, catalystId: string) => {
    e?.stopPropagation?.();
    if (!user) return;
    router.push(`/catalyst/${catalystId}/edit`);
  };

  const handleDeletePress = async (e: any, catalyst: Catalyst) => {
    e?.stopPropagation?.();
    if (!user) return;
    if (catalyst.owner_id !== user.id) return;
    if (catalyst.visibility === 'system') return;

    const confirmed = await showConfirm(
      'Delete Coach',
      `Are you sure you want to delete "${catalyst.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteCatalyst(catalyst.id);
      await loadCatalysts();
      showAlert('Deleted', 'Coach deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete coach');
    }
  };

  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat;
  const showTestNav = __DEV__ || skipRevenueCat || Constants.expoConfig?.extra?.showTestNav;

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredBuiltIn = searchLower
    ? BUILT_IN_COACHES.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
      )
    : BUILT_IN_COACHES;
  const filteredCatalysts = searchLower
    ? catalysts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          (c.description ?? '').toLowerCase().includes(searchLower)
      )
    : catalysts;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const bottomPadding = showTestNav ? Math.max(insets.bottom, 48) : insets.bottom;
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.md + bottomPadding }]}
      refreshControl={user ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Choose Your Coach</Text>
          <View style={styles.headerActions}>
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

      {/* Saved results (local) */}
      {savedResults.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Saved</Text>
            {savedResults.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/saved' as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.seeAllLink}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          {savedResults.slice(0, 5).map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.savedCard}
              onPress={() => router.push(`/saved/${r.id}` as any)}
              onLongPress={async () => {
                const ok = await showConfirm('Delete', 'Remove this from saved?');
                if (ok) await deleteSavedResult(r.id);
              }}
            >
              <View style={styles.savedCardContent}>
                <Text style={styles.savedTitle} numberOfLines={1}>{r.coachTitle}</Text>
                <Text style={styles.savedDate}>{new Date(r.createdAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={async (e) => {
                  e.stopPropagation();
                  const ok = await showConfirm('Delete', 'Remove this from saved?');
                  if (ok) await deleteSavedResult(r.id);
                }}
              >
                <Text style={styles.savedDeleteText}>Delete</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* User's coaches (only when signed in) */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Coaches</Text>
          {loadingCatalysts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
            </View>
          ) : filteredCatalysts.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyStateCard}
              onPress={handleCreatePress}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyStateTitle}>Create your first Coach</Text>
              <Text style={styles.emptyStateText}>
                Build a custom coach tailored to your workflow.
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.coachGrid}>
              {filteredCatalysts.map((catalyst) => {
                const isOwner = user && catalyst.owner_id === user.id;
                const canEditDelete = isOwner && catalyst.visibility !== 'system' && plan === 'pro';
                return (
                  <TouchableOpacity
                    key={catalyst.id}
                    style={styles.coachCard}
                    onPress={() => handleCatalystPress(catalyst.id)}
                  >
                    <View style={styles.coachCardInner}>
                      <View style={[styles.coachIcon, { backgroundColor: theme.colors.accent }]}>
                        <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.coachCardContent}>
                        <View style={styles.coachCardHeader}>
                          <Text style={styles.coachName}>{catalyst.name}</Text>
                          {canEditDelete && (
                            <View style={styles.coachActions}>
                              <TouchableOpacity
                                style={styles.coachActionButton}
                                onPress={(e) => handleEditPress(e, catalyst.id)}
                              >
                                <Text style={styles.coachActionText}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.coachActionButton, styles.coachDeleteButton]}
                                onPress={(e) => handleDeletePress(e, catalyst)}
                              >
                                <Text style={styles.coachDeleteText}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                        {catalyst.description && (
                          <Text style={styles.coachDescription} numberOfLines={2}>
                            {catalyst.description}
                          </Text>
                        )}
                        <View style={styles.coachMeta}>
                          <Text style={styles.coachMetaText}>
                            {catalyst.inputs_json?.length || 0} inputs
                          </Text>
                          {catalyst.visibility === 'system' && (
                            <Text style={styles.systemBadge}>System</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.coachCardFooter}>
                      <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
            <Text style={styles.createButtonText}>+ Create Coach</Text>
          </TouchableOpacity>
        </View>
      )}

      {showTestNav && (
        <View style={styles.testNav}>
          <Text style={styles.testNavTitle}>Test Navigation</Text>
          <View style={styles.testNavButtons}>
            <TouchableOpacity
              style={styles.testNavButton}
              onPress={async () => {
                if (user) {
                  await signOut();
                  await new Promise((r) => setTimeout(r, 150));
                  router.replace('/signin');
                } else {
                  router.push('/signin');
                }
              }}
            >
              <Text style={styles.testNavButtonText}>{user ? 'Re-sign In' : 'Sign In'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testNavButton} onPress={() => router.push('/onboarding')}>
              <Text style={styles.testNavButtonText}>Onboarding</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testNavButton} onPress={() => router.push('/paywall')}>
              <Text style={styles.testNavButtonText}>Paywall</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testNavButton, catalysts.length === 0 && styles.testNavButtonDisabled]}
              onPress={() => {
                if (catalysts.length === 0) return;
                if (plan === 'free') router.push('/paywall');
                else router.push(`/catalyst/${catalysts[0].id}`);
              }}
              disabled={catalysts.length === 0}
            >
              <Text style={styles.testNavButtonText}>
                Run Coach
                {catalysts.length === 0 ? ' (create one first)' : plan === 'free' ? ' → Upgrade' : ''}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testNavSection}>
            <Text style={styles.testNavLabel}>Current Plan: {plan}</Text>
            <View style={styles.testNavButtons}>
              <TouchableOpacity
                style={[styles.testNavButton, plan === 'free' && styles.testNavButtonActive]}
                onPress={() => setPlanForTesting?.('free')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Text style={styles.testNavButtonText}>Set Free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testNavButton, plan === 'pro' && styles.testNavButtonActive]}
                onPress={() => setPlanForTesting?.('pro')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Text style={styles.testNavButtonText}>Set Pro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  header: { marginBottom: theme.spacing.xl },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    flex: 1,
  },
  headerActions: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
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
  section: { marginBottom: theme.spacing.xl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  seeAllLink: { ...theme.typography.bodySmall, color: theme.colors.accent, fontWeight: '600' },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  loadingContainer: { padding: theme.spacing.lg, alignItems: 'center' },
  emptyStateCard: {
    backgroundColor: theme.colors.accentLightBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  savedCardContent: { flex: 1, marginRight: theme.spacing.sm },
  savedTitle: { ...theme.typography.h3, color: theme.colors.text },
  savedDate: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  savedDeleteText: { ...theme.typography.bodySmall, color: theme.colors.error, fontWeight: '600' },
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
  coachActions: { flexDirection: 'row', gap: theme.spacing.sm },
  coachActionButton: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm },
  coachActionText: { ...theme.typography.bodySmall, color: theme.colors.accent, fontWeight: '600' },
  coachDeleteButton: {},
  coachDeleteText: { ...theme.typography.bodySmall, color: theme.colors.error, fontWeight: '600' },
  coachName: { ...theme.typography.h3, color: theme.colors.text },
  coachDescription: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  coachMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.xs },
  coachMetaText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  systemBadge: { ...theme.typography.bodySmall, color: theme.colors.accent, fontWeight: '600' },
  proBadge: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  createButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  testNav: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  testNavTitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  testNavButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  testNavButton: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  testNavButtonText: { ...theme.typography.bodySmall, color: theme.colors.text },
  testNavButtonActive: { backgroundColor: theme.colors.accent },
  testNavButtonDisabled: { opacity: 0.5 },
  testNavSection: { marginTop: theme.spacing.md },
  testNavLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});
