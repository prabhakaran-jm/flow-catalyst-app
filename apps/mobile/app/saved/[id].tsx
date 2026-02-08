import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppStore } from '@/store/appStore';
import { showAlert, showConfirm } from '@/src/lib/alert';
import { normalizeRefineOutput } from '@/src/lib/formatOutput';

export default function SavedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { savedResults, loadSavedResults, deleteSavedResult } = useAppStore();
  const [copied, setCopied] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    loadSavedResults().then(() => setHasLoaded(true));
  }, [loadSavedResults]);

  const result = savedResults.find((r) => r.id === id);

  React.useEffect(() => {
    if (id && hasLoaded && !result) {
      router.replace('/');
    }
  }, [id, hasLoaded, result, router]);

  const hasOutput = !!(result?.output && result.output.trim());

  const handleCopy = async () => {
    if (hasOutput) {
      await Clipboard.setStringAsync(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleSend = async () => {
    if (hasOutput) {
      await Share.share({ message: result.output, title: result.coachTitle });
    }
  };

  const handleDelete = async () => {
    if (!result) return;
    const ok = await showConfirm('Delete', 'Remove this from your saved results?');
    if (!ok) return;
    try {
      await deleteSavedResult(result.id);
      showAlert('Deleted', '', () => router.back());
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (!hasLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }
  if (!result) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.coachName}>{result.coachTitle}</Text>
        <Text style={styles.date}>{new Date(result.createdAt).toLocaleString()}</Text>
      </View>

      <View style={styles.outputContainer}>
        <Markdown>{normalizeRefineOutput(result.output || '')}</Markdown>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, !hasOutput && styles.actionButtonDisabled]}
          onPress={handleCopy}
          disabled={!hasOutput}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={hasOutput ? theme.colors.accent : theme.colors.textSecondary} />
          <Text style={[styles.actionText, !hasOutput && styles.actionTextDisabled]}>{copied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasOutput && styles.actionButtonDisabled]}
          onPress={handleSend}
          disabled={!hasOutput}
        >
          <Ionicons name="share-outline" size={20} color={hasOutput ? theme.colors.accent : theme.colors.textSecondary} />
          <Text style={[styles.actionText, !hasOutput && styles.actionTextDisabled]}>Send</Text>
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
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
  header: { marginBottom: theme.spacing.lg },
  coachName: { ...theme.typography.h2, color: theme.colors.text },
  date: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  outputContainer: { marginBottom: theme.spacing.xl },
  actions: { flexDirection: 'row', gap: theme.spacing.md, flexWrap: 'wrap' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
  actionButtonDisabled: { opacity: 0.5 },
  actionText: { ...theme.typography.bodySmall, color: theme.colors.accent, fontWeight: '600' },
  actionTextDisabled: { color: theme.colors.textSecondary },
  deleteButton: {},
  deleteText: { color: theme.colors.error },
});
