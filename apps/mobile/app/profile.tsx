import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import { theme } from '@/theme';
import { fetchProfile, updateProfile } from '@/src/lib/api';
import { showAlert } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { loading: authLoading, user } = useSupabase();
  const { plan, offerings, refreshEntitlements, restorePurchases } = useRevenueCat();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat;
  const isDev = __DEV__ || skipRevenueCat;

  // Form state
  const [domain, setDomain] = useState('');
  const [workStyle, setWorkStyle] = useState('');
  const [valuesInput, setValuesInput] = useState('');

  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored.');
    } catch (e) {
      Alert.alert('Restore failed', e instanceof Error ? e.message : 'No subscription found.');
    } finally {
      setRestoring(false);
    }
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  const PROFILE_LOAD_TIMEOUT_MS = 20000;

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timed out')), PROFILE_LOAD_TIMEOUT_MS)
      );
      const profile = await Promise.race([fetchProfile(), timeoutPromise]);

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
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadProfile();
  }, [user, loadProfile]);

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

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  // Show form with error + retry when profile load failed (e.g. timeout) so user isn't stuck
  if (error && !loading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Your profile helps personalize AI responses in catalysts</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadProfile()} disabled={loading}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Context</Text>
        </View>

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={[styles.planBadge, plan === 'pro' && styles.planBadgePro]}>
            <Text style={[styles.planBadgeText, plan === 'pro' && styles.planBadgeTextPro]}>
              {plan.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionText}>
            {plan === 'pro' 
              ? 'You have full access to all coaches and features.' 
              : 'Upgrade to unlock custom coaches, unlimited runs, and the Magic Wand.'}
          </Text>
          {plan === 'free' ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/paywall')}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
              {restoring ? <ActivityIndicator size="small" color={theme.colors.accent} /> : <Text style={styles.restoreButtonText}>Restore Purchases</Text>}
            </TouchableOpacity>
          )}
        </View>

        {isDev && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Judge / Debug Info</Text>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>SDK Type:</Text>
              <Text style={styles.debugValue}>{skipRevenueCat ? 'Stub (Demo)' : 'Native (RevenueCat)'}</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Offerings:</Text>
              <Text style={styles.debugValue}>{offerings?.current ? `${offerings.current.availablePackages.length} packages` : 'Not loaded'}</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Store OS:</Text>
              <Text style={styles.debugValue}>{Platform.OS}</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={() => refreshEntitlements()}>
              <Text style={styles.refreshButtonText}>Refresh Entitlements</Text>
            </TouchableOpacity>
          </View>
        )}

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  planBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  planBadgePro: {
    backgroundColor: theme.colors.accent,
  },
  planBadgeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '700',
  },
  planBadgeTextPro: {
    color: '#FFFFFF',
  },
  subscriptionCard: {
    backgroundColor: theme.colors.accentLightBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subscriptionText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  upgradeButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  upgradeButtonText: {
    ...theme.typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  restoreButton: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  restoreButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  debugSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  debugTitle: {
    ...theme.typography.bodySmall,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  debugLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  debugValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  retryButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  refreshButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    padding: theme.spacing.xs,
  },
  refreshButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
