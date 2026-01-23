import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { theme } from '@/theme';
import { runCatalyst } from '@/src/lib/api';
import { useSupabase } from '@/src/providers/SupabaseProvider';

export default function CatalystDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading: authLoading } = useSupabase();
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [promptDebug, setPromptDebug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddInput = () => {
    if (inputKey.trim()) {
      setInputs((prev) => ({
        ...prev,
        [inputKey.trim()]: inputValue.trim() || inputValue,
      }));
      setInputKey('');
      setInputValue('');
    }
  };

  const handleRemoveInput = (key: string) => {
    setInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[key];
      return newInputs;
    });
  };

  const handleRun = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setOutput(null);
    setPromptDebug(null);

    try {
      const result = await runCatalyst({
        catalystId: id,
        inputs,
      });
      setOutput(result.output);
      setPromptDebug(result.promptDebug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run catalyst');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Run Catalyst</Text>
        <Text style={styles.id}>ID: {id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inputs</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputKey]}
            placeholder="Key"
            placeholderTextColor={theme.colors.textSecondary}
            value={inputKey}
            onChangeText={setInputKey}
          />
          <TextInput
            style={[styles.input, styles.inputValue]}
            placeholder="Value"
            placeholderTextColor={theme.colors.textSecondary}
            value={inputValue}
            onChangeText={setInputValue}
            multiline
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddInput}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(inputs).length > 0 && (
          <View style={styles.inputsList}>
            {Object.entries(inputs).map(([key, value]) => (
              <View key={key} style={styles.inputItem}>
                <View style={styles.inputItemContent}>
                  <Text style={styles.inputItemKey}>{key}:</Text>
                  <Text style={styles.inputItemValue}>{String(value)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveInput(key)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.runButton, loading && styles.runButtonDisabled]}
        onPress={handleRun}
        disabled={loading || Object.keys(inputs).length === 0}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.runButtonText}>Run Catalyst</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {output && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Output</Text>
          <View style={styles.outputContainer}>
            <Text style={styles.outputText}>{output}</Text>
          </View>
        </View>
      )}

      {promptDebug && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prompt Debug</Text>
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>{promptDebug}</Text>
          </View>
        </View>
      )}
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  id: {
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
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
  },
  inputKey: {
    flex: 2,
  },
  inputValue: {
    flex: 3,
    minHeight: 40,
  },
  addButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
  },
  addButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  inputsList: {
    gap: theme.spacing.sm,
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  inputItemContent: {
    flex: 1,
    flexDirection: 'row',
  },
  inputItemKey: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },
  inputItemValue: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  removeButtonText: {
    ...theme.typography.h2,
    color: theme.colors.error,
    fontSize: 24,
  },
  runButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
  outputContainer: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  outputText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  debugContainer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  debugText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
});
