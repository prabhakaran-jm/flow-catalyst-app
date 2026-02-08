import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppStore } from '@/store/appStore';
import { showAlert, showConfirm } from '@/src/lib/alert';

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

export default function SavedScreen() {
  const router = useRouter();
  const { savedResults, loadSavedResults, deleteSavedResult } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedResults();
    setRefreshing(false);
  }, [loadSavedResults]);

  useFocusEffect(
    useCallback(() => {
      loadSavedResults();
    }, [loadSavedResults])
  );

  const handleDelete = async (id: string) => {
    const ok = await showConfirm('Delete', 'Remove this from saved?');
    if (!ok) return;
    try {
      await deleteSavedResult(id);
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Saved</Text>
      <Text style={styles.subtitle}>Your saved coach outputs</Text>

      {savedResults.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No saved results yet</Text>
          <Text style={styles.emptyText}>Run a coach and tap Save to add it here.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>Browse Coaches</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {savedResults.map((r) => (
            <View key={r.id} style={styles.card}>
              <TouchableOpacity style={styles.cardContent} onPress={() => router.push(`/saved/${r.id}`)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <Text style={styles.coachName}>{r.coachTitle}</Text>
                  <Text style={styles.date}>{formatDate(r.createdAt)}</Text>
                </View>
                <Text style={styles.outputPreview} numberOfLines={3}>
                  {truncate((r.output || '').replace(/#+/g, '').trim(), 120)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(r.id)}>
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
