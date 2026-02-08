import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { theme } from '@/theme';
import { fetchCatalyst, updateCatalyst, Catalyst } from '@/src/lib/api';
import { showAlert } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

export default function EditCatalyst() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading, user } = useSupabase();
  const { plan } = useRevenueCat();

  const [catalyst, setCatalyst] = useState<Catalyst | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inputsJson, setInputsJson] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCatalyst, setLoadingCatalyst] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat;
  useEffect(() => {
    if (!authLoading && user && plan === 'free') {
      router.replace('/paywall');
    }
  }, [plan, authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      try {
        setLoadingCatalyst(true);
        const data = await fetchCatalyst(id);
        setCatalyst(data);
        if (data.owner_id !== user.id) {
          setError('You can only edit your own catalysts');
          return;
        }
        setName(data.name);
        setDescription(data.description || '');
        setInputsJson(JSON.stringify(data.inputs_json || [], null, 2));
        setPromptTemplate(data.prompt_template || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load catalyst');
      } finally {
        setLoadingCatalyst(false);
      }
    };
    load();
  }, [id, user]);

  const handleSave = async () => {
    if (!id || plan === 'free') return;

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
      await updateCatalyst(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        inputs_json: parsedInputs,
        prompt_template: promptTemplate.trim(),
      });

      showAlert('Success', 'Coach updated successfully!', () => {
        router.replace(`/catalyst/${id}`);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update catalyst';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingCatalyst || (plan === 'free' && !skipRevenueCat)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!catalyst || error) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Coach not found'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter coach name"
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
            placeholder="Describe what this coach does"
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
            Example: {`[{"name": "task", "type": "string"}]`}
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
            placeholder="Enter the prompt template for this coach"
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
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
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
  backButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
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
