import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { fetchCatalysts, type Catalyst } from '@/src/lib/api';
import { showAlert } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import Constants from 'expo-constants';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max).trim() + '...';
}

export default function CoachesScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabase();
  const { plan } = useRevenueCat();
  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat === true;
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalysts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchCatalysts();
      setCatalysts(data);
    } catch (err) {
      console.error('Failed to load coaches:', err);
      showAlert('Error', err instanceof Error ? err.message : 'Failed to load your coaches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        router.replace('/signin');
        return;
      }
      if (plan === 'free' && !skipRevenueCat) {
        router.replace('/paywall');
        return;
      }
      setLoading(true);
      loadCatalysts();
    }, [user, plan, skipRevenueCat, loadCatalysts, router])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCatalysts();
  }, [loadCatalysts]);

  const handleCreatePress = () => {
    if (plan === 'free' && !skipRevenueCat) {
      router.push('/paywall');
      return;
    }
    router.push('/catalyst/create');
  };

  const handleCoachPress = (catalyst: Catalyst) => {
    router.push(`/catalyst/${catalyst.id}`);
  };

  if (authLoading || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (plan === 'free' && !skipRevenueCat) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Coaches</Text>
      <Text style={styles.subtitle}>Create and manage your custom AI coaches</Text>

      <TouchableOpacity style={styles.createCard} onPress={handleCreatePress} activeOpacity={0.8}>
        <View style={styles.createCardInner}>
          <View style={styles.createIconWrap}>
            <Ionicons name="add-circle" size={32} color={theme.colors.accent} />
          </View>
          <View style={styles.createCardContent}>
            <Text style={styles.createCardTitle}>Create Coach</Text>
            <Text style={styles.createCardSubtitle}>Build a custom coach with your own prompts and logic</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Coaches</Text>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
          </View>
        ) : catalysts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No custom coaches yet</Text>
            <Text style={styles.emptyHint}>Tap Create Coach above to build your first one</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {catalysts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.coachCard}
                onPress={() => handleCoachPress(c)}
                activeOpacity={0.7}
              >
                <View style={styles.coachCardContent}>
                  <Text style={styles.coachName}>{c.name}</Text>
                  <Text style={styles.coachDescription} numberOfLines={2}>
                    {truncate(c.description || 'No description', 80)}
                  </Text>
                  <Text style={styles.coachDate}>{formatDate(c.created_at)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  createCard: {
    backgroundColor: theme.colors.accentLightBackground,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  createCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  createIconWrap: {
    marginRight: theme.spacing.md,
  },
  createCardContent: {
    flex: 1,
  },
  createCardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  createCardSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  loadingWrap: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptyHint: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  list: {
    gap: theme.spacing.sm,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  coachCardContent: {
    flex: 1,
  },
  coachName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  coachDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  coachDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
