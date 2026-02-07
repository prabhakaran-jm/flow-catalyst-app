import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { theme } from '@/theme';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { fetchCatalysts, deleteCatalyst, Catalyst } from '@/src/lib/api';
import { showAlert, showConfirm } from '@/src/lib/alert';

export default function Index() {
  const router = useRouter();
  const { plan, setPlanForTesting } = useRevenueCat();
  const { user, loading, signOut } = useSupabase();
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loadingCatalysts, setLoadingCatalysts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect to sign-in if not authenticated; refresh catalysts when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (!loading && !user) {
        router.replace('/signin');
      } else if (user) {
        // Refresh list when returning from create/edit (ensures new catalysts appear)
        loadCatalysts();
      }
    }, [user, loading, router, loadCatalysts])
  );

  // Fetch catalysts when user is available
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

  // Load catalysts on mount and when user changes
  useEffect(() => {
    if (user) {
      loadCatalysts();
    }
  }, [user, loadCatalysts]);

  // Refresh catalysts
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCatalysts();
    setRefreshing(false);
  }, [loadCatalysts]);

  const handleCreatePress = () => {
    if (plan === 'free') {
      router.push('/paywall');
    } else {
      router.push('/catalyst/create');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/signin');
  };

  const handleCatalystPress = (catalystId: string) => {
    router.push(`/catalyst/${catalystId}`);
  };

  const handleEditPress = (e: any, catalystId: string) => {
    e?.stopPropagation?.();
    router.push(`/catalyst/${catalystId}/edit`);
  };

  const handleDeletePress = async (e: any, catalyst: Catalyst) => {
    e?.stopPropagation?.();
    if (!user) return;
    if (catalyst.owner_id !== user.id) return;
    if (catalyst.visibility === 'system') return;

    const confirmed = await showConfirm(
      'Delete Catalyst',
      `Are you sure you want to delete "${catalyst.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteCatalyst(catalyst.id);
      await loadCatalysts();
      showAlert('Deleted', 'Catalyst deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete catalyst');
    }
  };

  // Show loading or nothing while checking auth
  if (loading || !user) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Action Catalysts</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push('/profile')} 
              style={styles.profileButton}
            >
              <Text style={styles.profileButtonText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>Turn advice into instant actions</Text>
        {user?.email && (
          <Text style={styles.userEmail}>Signed in as {user.email}</Text>
        )}
      </View>

      <View style={styles.catalystList}>
        <Text style={styles.sectionTitle}>Your Catalysts</Text>
        
        {loadingCatalysts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : catalysts.length === 0 ? (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              No catalysts yet. Create your first one!
            </Text>
          </View>
        ) : (
          <View style={styles.catalystsGrid}>
            {catalysts.map((catalyst) => {
              const isOwner = user && catalyst.owner_id === user.id;
              const canEditDelete = isOwner && catalyst.visibility !== 'system';
              return (
                <TouchableOpacity
                  key={catalyst.id}
                  style={styles.catalystCard}
                  onPress={() => handleCatalystPress(catalyst.id)}
                >
                  <View style={styles.catalystCardHeader}>
                    <Text style={styles.catalystName}>{catalyst.name}</Text>
                    {canEditDelete && (
                      <View style={styles.catalystActions}>
                        <TouchableOpacity
                          style={styles.catalystActionButton}
                          onPress={(e) => handleEditPress(e, catalyst.id)}
                        >
                          <Text style={styles.catalystActionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.catalystActionButton, styles.catalystDeleteButton]}
                          onPress={(e) => handleDeletePress(e, catalyst)}
                        >
                          <Text style={styles.catalystDeleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {catalyst.description && (
                    <Text style={styles.catalystDescription} numberOfLines={2}>
                      {catalyst.description}
                    </Text>
                  )}
                  <View style={styles.catalystMeta}>
                    <Text style={styles.catalystMetaText}>
                      {catalyst.inputs_json?.length || 0} inputs
                    </Text>
                    {catalyst.visibility === 'system' && (
                      <Text style={styles.systemBadge}>System</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
          <Text style={styles.createButtonText}>+ Create Catalyst</Text>
        </TouchableOpacity>
      </View>

      {/* Test Navigation - Remove in production */}
      <View style={styles.testNav}>
        <Text style={styles.testNavTitle}>Test Navigation</Text>
        <View style={styles.testNavButtons}>
          <TouchableOpacity 
            style={styles.testNavButton} 
            onPress={async () => {
              if (user) {
                await signOut();
                // Brief delay so auth state propagates before signin mounts (avoids redirect loop)
                await new Promise((r) => setTimeout(r, 150));
                router.replace('/signin');
              } else {
                router.push('/signin');
              }
            }}
          >
            <Text style={styles.testNavButtonText}>{user ? 'Re-sign In' : 'Sign In'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testNavButton} 
            onPress={() => router.push('/onboarding')}
          >
            <Text style={styles.testNavButtonText}>Onboarding</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testNavButton} 
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.testNavButtonText}>Paywall</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.testNavButton, catalysts.length === 0 && styles.testNavButtonDisabled]}
            onPress={() => {
              if (catalysts.length === 0) return;
              if (plan === 'free') {
                router.push('/paywall');
              } else {
                router.push(`/catalyst/${catalysts[0].id}`);
              }
            }}
            disabled={catalysts.length === 0}
          >
            <Text style={styles.testNavButtonText}>
              Run Catalyst
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  profileButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
  },
  signOutButton: {
    padding: theme.spacing.xs,
  },
  signOutText: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  userEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  catalystList: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  catalystsGrid: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  catalystCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  catalystCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  catalystActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  catalystActionButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  catalystActionText: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  catalystDeleteButton: {},
  catalystDeleteText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    fontWeight: '600',
  },
  catalystName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  catalystDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  catalystMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catalystMetaText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  systemBadge: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
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
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  testNavButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
  },
  testNavButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  testNavButtonDisabled: {
    opacity: 0.5,
  },
  testNavSection: {
    marginTop: theme.spacing.md,
  },
  testNavLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});
