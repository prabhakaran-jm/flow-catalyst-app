import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { fetchSavedRun, deleteSavedRun, SavedRun } from '@/src/lib/api';
import { showAlert, showConfirm } from '@/src/lib/alert';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<SavedRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchSavedRun(id)
      .then(setRun)
      .catch((err) => showAlert('Error', err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async () => {
    if (run?.output) {
      await Clipboard.setStringAsync(run.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleShare = async () => {
    if (run?.output) {
      await Share.share({ message: run.output, title: run.coach_name });
    }
  };

  const handleDelete = async () => {
    if (!run) return;
    const ok = await showConfirm('Delete', 'Remove this from your library?');
    if (!ok) return;
    try {
      await deleteSavedRun(run.id);
      showAlert('Deleted', '', () => router.back());
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!run) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.coachName}>{run.coach_name}</Text>
        <Text style={styles.date}>{new Date(run.created_at).toLocaleString()}</Text>
      </View>

      <View style={styles.outputContainer}>
        <Markdown>
          {run.output
            .replace(/([^\n\r])##/g, '$1\n\n##')
            .replace(/##([^\s#\n])/g, '## $1')
            .replace(/([^\n\r])-\s/g, '$1\n- ')
            .replace(/([^\n\r])(\d+\.\s)/g, '$1\n$2')
            .replace(/\n{3,}/g, '\n\n')
            .trim()}
        </Markdown>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={theme.colors.accent} />
          <Text style={styles.actionText}>{copied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
  header: { marginBottom: theme.spacing.lg },
  coachName: { ...theme.typography.h2, color: theme.colors.text },
  date: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  outputContainer: { marginBottom: theme.spacing.xl },
  actions: { flexDirection: 'row', gap: theme.spacing.md, flexWrap: 'wrap' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
  actionText: { ...theme.typography.bodySmall, color: theme.colors.accent, fontWeight: '600' },
  deleteButton: {},
  deleteText: { color: theme.colors.error },
});
