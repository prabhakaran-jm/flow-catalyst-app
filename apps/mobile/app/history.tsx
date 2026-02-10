import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { fetchSavedRuns, deleteSavedRun, SavedRun } from '@/src/lib/api';
import { showAlert, showConfirm } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';

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
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + '...';
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabase();
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRuns = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchSavedRuns();
      setRuns(data);
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Failed to load history');
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
      setLoading(true);
      loadRuns();
    }, [user, loadRuns, router])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRuns();
  }, [loadRuns]);

  const handleDelete = async (run: SavedRun) => {
    const ok = await showConfirm('Delete', `Remove "${run.coach_name}" from your library?`);
    if (!ok) return;
    try {
      await deleteSavedRun(run.id);
      setRuns((prev) => prev.filter((r) => r.id !== run.id));
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleOpen = (run: SavedRun) => {
    router.push({ pathname: '/history/[id]', params: { id: run.id } } as any);
  };

  if (authLoading || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>My Library</Text>
      <Text style={styles.subtitle}>Saved coach outputs</Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
      ) : runs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No saved runs yet</Text>
          <Text style={styles.emptyText}>Run a coach and tap "Save to library" to add it here.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>Browse Coaches</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {runs.map((run) => (
            <View key={run.id} style={styles.card}>
              <TouchableOpacity style={styles.cardContent} onPress={() => handleOpen(run)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <Text style={styles.coachName}>{run.coach_name}</Text>
                  <Text style={styles.date}>{formatDate(run.created_at)}</Text>
                </View>
                <Text style={styles.outputPreview} numberOfLines={3}>
                  {truncate(run.output.replace(/#+/g, '').trim(), 120)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(run)}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
  loader: { marginTop: theme.spacing.xl },
  empty: { alignItems: 'center', paddingVertical: theme.spacing.xl * 2 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, marginTop: theme.spacing.md },
  emptyText: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' },
  browseButton: { marginTop: theme.spacing.lg, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.lg },
  browseButtonText: { ...theme.typography.body, color: theme.colors.background, fontWeight: '600' },
  list: { gap: theme.spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  coachName: { ...theme.typography.h3, color: theme.colors.text },
  date: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  outputPreview: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
  deleteButton: { padding: theme.spacing.sm },
});