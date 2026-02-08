import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import { theme } from '@/theme';
import MagicWandButton from '@/src/components/MagicWandButton';
import { createCatalyst } from '@/src/lib/api';
import { getRealAISuggestion } from '@/utils/ai-service';
import { normalizeRefineOutput } from '@/src/lib/formatOutput';
import { showAlert } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

export default function CreateCatalyst() {
  const router = useRouter();
  const { loading: authLoading, user } = useSupabase();
  const { plan } = useRevenueCat();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat;
  useEffect(() => {
    if (!authLoading && user && plan === 'free' && !skipRevenueCat) {
      router.replace('/paywall');
    }
  }, [plan, authLoading, user, router, skipRevenueCat]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inputsJson, setInputsJson] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState<string | null>(null);

  const handleMagicWandPress = useCallback(
    async (field: 'name' | 'description' | 'inputsJson' | 'promptTemplate', fieldType?: 'advice' | 'context' | 'name') => {
      if (Platform.OS !== 'web') Vibration.vibrate(10);
      setIsRefining(field);

      if (fieldType === 'advice' || fieldType === 'context' || fieldType === 'name') {
        const currentText =
          field === 'name'
            ? name
            : field === 'description'
              ? description
              : field === 'inputsJson'
                ? inputsJson
                : promptTemplate;
        try {
          let newText = await getRealAISuggestion(fieldType, currentText.trim());
          if (field === 'name') {
            newText = newText.split('\n')[0].trim().slice(0, 80);
          } else {
            newText = normalizeRefineOutput(newText);
          }
          if (field === 'name') setName(newText);
          else if (field === 'description') setDescription(newText);
        } catch (err) {
          console.error('AI Magic Wand failed:', err);
          showAlert('Refinement failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
          setIsRefining(null);
        }
      } else {
        const CREATE_AI_SUGGESTIONS: Record<string, string> = {
          inputsJson: '[{"name": "topic", "type": "string"}, {"name": "audience", "type": "string"}]',
          promptTemplate: 'You are a writing coach. Help create a compelling hook for: {topic}. Audience: {audience}.',
        };
        const suggestion = CREATE_AI_SUGGESTIONS[field] ?? '';
        if (field === 'inputsJson') setInputsJson((prev) => (prev.trim() ? `${prev}\n${suggestion}` : suggestion));
        else if (field === 'promptTemplate') setPromptTemplate((prev) => (prev.trim() ? `${prev}\n${suggestion}` : suggestion));
        setIsRefining(null);
      }
    },
    [name, description, inputsJson, promptTemplate]
  );

  const handleSave = async () => {
    if (plan === 'free' && !skipRevenueCat) {
      router.push('/paywall');
      return;
    }

    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }

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
      showAlert('Success', 'Coach created successfully!', () => router.back());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create catalyst';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (plan === 'free' && !skipRevenueCat)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.progressStepper}>
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, styles.inputSingle]}
                placeholder="Enter coach name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                editable={!isRefining}
              />
              <MagicWandButton
                onPress={() => handleMagicWandPress('name', 'name')}
                loading={isRefining === 'name'}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what this coach does"
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!isRefining}
              />
              <MagicWandButton
                onPress={() => handleMagicWandPress('description', 'context')}
                loading={isRefining === 'description'}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Inputs JSON (Array)</Text>
            <Text style={styles.hint}>
              Example: {`[{"name": "task", "type": "string"}]`}
            </Text>
            <View style={styles.inputWithIcon}>
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
                editable={!isRefining}
              />
              <MagicWandButton
                onPress={() => handleMagicWandPress('inputsJson')}
                loading={isRefining === 'inputsJson'}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Prompt Template *</Text>
            <Text style={styles.hint}>
              Use {`{inputs}`} to reference inputs in your template
            </Text>
            <View style={styles.inputWithIcon}>
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
                editable={!isRefining}
              />
              <MagicWandButton
                onPress={() => handleMagicWandPress('promptTemplate')}
                loading={isRefining === 'promptTemplate'}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.cancelRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading || !name.trim() || !promptTemplate.trim()}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save Coach</Text>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  progressStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
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
  inputWithIcon: {
    position: 'relative',
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingRight: 48,
    color: theme.colors.text,
  },
  inputSingle: {},
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
  cancelRow: {
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveButtonContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
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
