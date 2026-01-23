import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { theme } from '@/theme';
import { createCatalyst } from '@/src/lib/api';
import { useSupabase } from '@/src/providers/SupabaseProvider';

export default function CreateCatalyst() {
  const router = useRouter();
  const { loading: authLoading } = useSupabase();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inputsJson, setInputsJson] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !promptTemplate.trim()) {
      setError('Name and prompt template are required');
      return;
    }

    let parsedInputs: any[] = [];
    if (inputsJson.trim()) {
      try {
        parsedInputs = JSON.parse(inputsJson);
        if (!Array.isArray(parsedInputs)) {
          setError('inputs_json must be a valid JSON array');
          return;
        }
      } catch (err) {
        setError('Invalid JSON format for inputs. Must be a valid JSON array.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const catalyst = await createCatalyst({
        name: name.trim(),
        description: description.trim() || undefined,
        inputs_json: parsedInputs,
        prompt_template: promptTemplate.trim(),
      });

      Alert.alert('Success', 'Catalyst created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create catalyst');
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
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter catalyst name"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what this catalyst does"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Inputs JSON (Array)</Text>
          <Text style={styles.hint}>
            Example: [{"name": "task", "type": "string"}]
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, styles.codeInput]}
            placeholder='[{"name": "input1", "type": "string"}]'
            placeholderTextColor={theme.colors.textSecondary}
            value={inputsJson}
            onChangeText={(text) => {
              setInputsJson(text);
              setError(null);
            }}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Prompt Template *</Text>
          <Text style={styles.hint}>
            Use {`{inputs}`} to reference inputs in your template
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter the prompt template for this catalyst"
            placeholderTextColor={theme.colors.textSecondary}
            value={promptTemplate}
            onChangeText={(text) => {
              setPromptTemplate(text);
              setError(null);
            }}
            multiline
            numberOfLines={8}
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading || !name.trim() || !promptTemplate.trim()}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Create</Text>
          )}
        </TouchableOpacity>
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
  form: {
    marginBottom: theme.spacing.lg,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  hint: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
});
