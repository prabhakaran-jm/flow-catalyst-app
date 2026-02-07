import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { theme } from '@/theme';
import { fetchProfile, updateProfile } from '@/src/lib/api';
import { showAlert } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { loading: authLoading, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [domain, setDomain] = useState('');
  const [workStyle, setWorkStyle] = useState('');
  const [valuesInput, setValuesInput] = useState('');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const profile = await fetchProfile();
        
        if (profile) {
          setDomain(profile.domain || '');
          setWorkStyle(profile.work_style || '');
          setValuesInput(profile.values?.join(', ') || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      // Parse values from comma-separated string
      const values = valuesInput
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);

      await updateProfile({
        domain: domain.trim() || null,
        work_style: workStyle.trim() || null,
        values: values.length > 0 ? values : null,
      });

      showAlert('Success', 'Profile updated successfully!', () => router.back());
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>
          Your profile helps personalize AI responses in catalysts
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Domain</Text>
          <Text style={styles.hint}>
            Your area of work or expertise (e.g., "Software Development", "Marketing")
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Software Development"
            placeholderTextColor={theme.colors.textSecondary}
            value={domain}
            onChangeText={(text) => {
              setDomain(text);
              setError(null);
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Work Style</Text>
          <Text style={styles.hint}>
            How you prefer to work (e.g., "Agile", "Remote-first", "Deep Focus")
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Agile, Remote-first"
            placeholderTextColor={theme.colors.textSecondary}
            value={workStyle}
            onChangeText={(text) => {
              setWorkStyle(text);
              setError(null);
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Values</Text>
          <Text style={styles.hint}>
            Comma-separated list of your core values (e.g., "Innovation, Collaboration, Work-life balance")
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Innovation, Collaboration, Work-life balance"
            placeholderTextColor={theme.colors.textSecondary}
            value={valuesInput}
            onChangeText={(text) => {
              setValuesInput(text);
              setError(null);
            }}
            multiline
            numberOfLines={3}
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
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
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
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  field: {
    marginBottom: theme.spacing.lg,
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
    minHeight: 80,
    textAlignVertical: 'top',
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
