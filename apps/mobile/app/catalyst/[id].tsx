import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
  Vibration,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import { theme } from '@/theme';
import { runCatalyst, runBuiltInCoach, fetchCatalyst, deleteCatalyst, saveRun, fetchProfile, Catalyst } from '@/src/lib/api';
import { showAlert, showConfirm, showAlertWithActions } from '@/src/lib/alert';
import { useSupabase } from '@/src/providers/SupabaseProvider';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';
import { useAppStore } from '@/store/appStore';
import { getBuiltInCoach, type BuiltInCoachId } from '@/src/lib/coaches';
import { getTodayRunCount, incrementRunCount, hasReachedDailyLimit } from '@/src/lib/runLimits';
import Markdown from 'react-native-markdown-display';
import MagicWandButton from '@/src/components/MagicWandButton';
import { getRealAISuggestion } from '@/utils/ai-service';

const BUILTIN_PREFIX = 'builtin-';

function normalizeMarkdownOutput(text: string): string {
  return text
    .replace(/([^\n\r])##/g, '$1\n\n##')
    .replace(/##([^\s#\n])/g, '## $1')
    .replace(/([^\n\r])-\s/g, '$1\n- ')
    .replace(/([^\n\r])(\d+\.\s)/g, '$1\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getBuiltInIdFromParam(id: string): BuiltInCoachId | null {
  if (id?.startsWith(BUILTIN_PREFIX)) {
    return id.slice(BUILTIN_PREFIX.length) as BuiltInCoachId;
  }
  return null;
}

export default function CatalystDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading, user } = useSupabase();
  const { plan } = useRevenueCat();
  const { anonymousRunsUsed, loadAnonymousRunsUsed, incrementAnonymousRunsUsed, hasSeenProfileNudge, setHasSeenProfileNudge, loadHasSeenProfileNudge } = useAppStore();

  const builtInId = id ? getBuiltInIdFromParam(id) : null;
  const builtInCoach = builtInId ? getBuiltInCoach(builtInId) : null;

  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [catalyst, setCatalyst] = useState<Catalyst | null>(null);
  const [loadingCatalyst, setLoadingCatalyst] = useState(true);
  const [output, setOutput] = useState<string | null>(null);
  const [promptDebug, setPromptDebug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyRuns, setDailyRuns] = useState(0);

  // Built-in coach: lever (0-100)
  const [leverValue, setLeverValue] = useState(50);
  const [isRefining, setIsRefining] = useState<string | null>(null);
  const [feedbackHelpful, setFeedbackHelpful] = useState<'helpful' | 'not-helpful' | null>(null);

  const maybeShowProfileNudge = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      const isEmpty = !profile?.domain && !profile?.work_style && (!profile?.values || profile.values.length === 0);
      if (isEmpty) {
        showAlertWithActions(
          'Add your context',
          'Add your domain, work style, and values in Profile for more personalized guidance.',
          'Add context',
          'Later',
          () => {
            setHasSeenProfileNudge();
            router.push('/profile');
          },
          () => setHasSeenProfileNudge()
        );
      }
    } catch {
      // Ignore
    }
  }, [setHasSeenProfileNudge, router]);

  const handleMagicWandPress = useCallback(
    async (field: string, fieldType: 'advice' | 'context') => {
      if (fieldType !== 'advice' && fieldType !== 'context') return;
      if (Platform.OS !== 'web') Vibration.vibrate(10);
      setIsRefining(field);
      const currentText = (inputs[field] ?? '').toString().trim();
      try {
        const newText = await getRealAISuggestion(fieldType, currentText);
        setInputs((prev) => ({ ...prev, [field]: newText }));
      } catch (err) {
        console.error('AI Magic Wand failed:', err);
        showAlert('Refinement failed', err instanceof Error ? err.message : 'Please try again');
      } finally {
        setIsRefining(null);
      }
    },
    [inputs]
  );

  useEffect(() => {
    loadAnonymousRunsUsed();
    loadHasSeenProfileNudge();
  }, [loadAnonymousRunsUsed, loadHasSeenProfileNudge]);

  const loadCatalyst = useCallback(async () => {
    if (!id || builtInId || !user) return;
    try {
      setLoadingCatalyst(true);
      setError(null);
      const data = await fetchCatalyst(id);
      setCatalyst(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coach');
    } finally {
      setLoadingCatalyst(false);
    }
  }, [id, builtInId, user]);

  useFocusEffect(
    useCallback(() => {
      if (builtInId) {
        setLoadingCatalyst(false);
      } else if (user) {
        loadCatalyst();
      } else {
        setLoadingCatalyst(false);
      }
      getTodayRunCount().then(setDailyRuns);
    }, [builtInId, user, loadCatalyst])
  );

  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat;
  const isAnonymous = !user;
  const isBuiltIn = !!builtInCoach;
  const isProOnlyCoach = builtInCoach?.proOnly ?? false;
  const canRunAnonymous = isAnonymous && anonymousRunsUsed < 1;
  const freeUserCanRun = plan === 'free' && !isProOnlyCoach;
  const mustUpgrade = plan === 'free' && isProOnlyCoach && !skipRevenueCat;


  const validationPrompt = builtInCoach?.slots.find((s) => s.required && !(inputs[s.name] ?? '').toString().trim());

  const handleRun = async () => {
    if (!id) return;
    if (!hasRequiredInputs) {
      showAlert('Fill required fields', validationPrompt ? validationPrompt.placeholder : 'Please fill in all required fields.');
      return;
    }

    if (mustUpgrade) {
      router.push('/paywall');
      return;
    }

    if (isBuiltIn) {
      if (isAnonymous && anonymousRunsUsed >= 1) {
        showAlert('Sign in to continue', "You've used your free run. Sign in to get more guidance.");
        router.push('/signin');
        return;
      }
      if (user && plan === 'free' && isProOnlyCoach && !skipRevenueCat) {
        router.push('/paywall');
        return;
      }
      if (user && plan === 'free' && !skipRevenueCat) {
        const reached = await hasReachedDailyLimit();
        if (reached) {
          showAlert('Daily limit reached', 'Upgrade to Pro for unlimited runs.');
          router.push('/paywall');
          return;
        }
      } else if (!user && anonymousRunsUsed >= 1) {
        showAlert('Sign in to continue', 'Sign in to get more guidance.');
        router.push('/signin');
        return;
      }
    } else {
      if (!user) {
        showAlert('Sign in to run', 'Sign in to run your saved coaches.');
        router.push('/signin');
        return;
      }
      if (plan === 'free' && !skipRevenueCat) {
        router.push('/paywall');
        return;
      }
    }

    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
    setLoading(true);
    setError(null);
    setOutput(null);
    setPromptDebug(null);

    try {
      if (isBuiltIn && builtInCoach) {
        const inputsToSend: Record<string, any> = { ...inputs };
        const leverName = builtInCoach.lever.name;
        const lerp = (a: string, b: string, t: number) => {
          if (t <= 0) return a;
          if (t >= 1) return b;
          return `${a} (${Math.round(t * 100)}% toward ${b})`;
        };
        inputsToSend[leverName] = lerp(
          builtInCoach.lever.minLabel,
          builtInCoach.lever.maxLabel,
          leverValue / 100
        );

        const result = await runBuiltInCoach({
          builtInId: builtInCoach.id,
          promptTemplate: builtInCoach.promptTemplate,
          inputs: inputsToSend,
        });
        setOutput(result.output);
        setPromptDebug(result.promptDebug);
        if (isAnonymous) {
          await incrementAnonymousRunsUsed();
        } else if (plan === 'free') {
          await incrementRunCount();
          setDailyRuns(await getTodayRunCount());
        }
        if (user && !hasSeenProfileNudge) {
          maybeShowProfileNudge();
        }
      } else if (catalyst) {
        const result = await runCatalyst({ catalystId: id, inputs });
        setOutput(result.output);
        setPromptDebug(result.promptDebug);
        if (user && !hasSeenProfileNudge) {
          maybeShowProfileNudge();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to run coach';
      setError(msg);
      if (msg.includes('Daily limit reached')) {
        showAlert('Daily limit reached', 'Upgrade to Pro for unlimited runs.');
        router.push('/paywall');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (output) {
      await Clipboard.setStringAsync(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleSend = async () => {
    if (output) {
      await Share.share({ message: output, title: 'Guidance' });
    }
  };

  const handleSave = async () => {
    if (!user) {
      showAlert('Sign in to save', 'Sign in to save and create your own coaches.');
      router.push('/signin');
      return;
    }
    if (!output) return;
    try {
      await saveRun({
        coachName: displayName,
        coachId: id || '',
        output,
        inputs: allInputs,
      });
      showAlert('Saved', 'Added to your library.');
    } catch (err) {
      showAlert('Save failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleRunAgain = () => {
    setOutput(null);
    setPromptDebug(null);
    setFeedbackHelpful(null);
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!isBuiltIn && !user) {
    router.replace('/signin');
    return null;
  }

  if (!builtInCoach && !catalyst && !loadingCatalyst) {
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

  const displayName = builtInCoach?.title ?? catalyst?.name ?? '';
  const displayDesc = builtInCoach?.description ?? catalyst?.description ?? '';

  const canEditDelete = catalyst && user?.id === catalyst.owner_id && catalyst.visibility !== 'system';

  const handleEdit = () => {
    if (id && catalyst) router.push(`/catalyst/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id || !catalyst) return;
    const confirmed = await showConfirm( 'Delete Coach', `Are you sure you want to delete "${catalyst.name}"? This cannot be undone.` );
    if (!confirmed) return;
    try {
      await deleteCatalyst(id);
      showAlert('Deleted', 'Coach deleted successfully.', () => router.back());
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Failed to delete coach');
    }
  };

  const showLimitWarning = isBuiltIn && !user && anonymousRunsUsed >= 1;
  const showDailyLimit = user && plan === 'free' && isProOnlyCoach === false;

  const buildInputsForBuiltIn = () => {
    if (!builtInCoach) return {};
    const r: Record<string, string> = {};
    r[builtInCoach.slots[0].name] = (inputs[builtInCoach.slots[0].name] ?? '').toString().trim();
    r[builtInCoach.slots[1].name] = (inputs[builtInCoach.slots[1].name] ?? '').toString().trim();
    return r;
  };

  const builtInInputs = buildInputsForBuiltIn();
  const allInputs = isBuiltIn ? builtInInputs : inputs;
  const hasRequiredInputs = isBuiltIn
    ? builtInCoach!.slots.every((s) => !s.required || (s.required && builtInInputs[s.name]?.trim()))
    : Object.keys(inputs).length > 0;

  const isRunDisabled = loading || !hasRequiredInputs || mustUpgrade || showLimitWarning;

  const content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!output && (
        <View style={styles.progressStepper}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{displayName}</Text>
          {canEditDelete && (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={handleEdit}>
                <Text style={styles.headerActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerActionButton, styles.headerDeleteButton]} onPress={handleDelete}>
                <Text style={styles.headerDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {displayDesc && <Text style={styles.description}>{displayDesc}</Text>}
        {freeUserCanRun && (
          <Text style={styles.runCount}>
            {dailyRuns}/3 runs today (Free)
          </Text>
        )}
      </View>

      {mustUpgrade && (
        <View style={styles.limitWarning}>
          <Text style={styles.limitWarningText}>
            Upgrade to Pro to use this coach.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/paywall')}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      )}

      {showLimitWarning && (
        <View style={styles.limitWarning}>
          <Text style={styles.limitWarningText}>
            Sign in to get more guidance.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/signin')}>
            <Text style={styles.upgradeButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {isBuiltIn && builtInCoach ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context</Text>
          <View style={styles.field}>
            <Text style={styles.label}>{builtInCoach.slots[0].name.charAt(0).toUpperCase() + builtInCoach.slots[0].name.slice(1)}</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={builtInCoach.slots[0].placeholder}
                placeholderTextColor={theme.colors.textSecondary}
                value={(inputs[builtInCoach.slots[0].name] ?? '').toString()}
                onChangeText={(t) => setInputs((p) => ({ ...p, [builtInCoach.slots[0].name]: t }))}
                editable={!isRefining}
                multiline
                numberOfLines={4}
              />
              <MagicWandButton
                onPress={() => handleMagicWandPress(builtInCoach.slots[0].name, 'advice')}
                loading={isRefining === builtInCoach.slots[0].name}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{builtInCoach.slots[1].name.charAt(0).toUpperCase() + builtInCoach.slots[1].name.slice(1)}</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={builtInCoach.slots[1].placeholder}
                placeholderTextColor={theme.colors.textSecondary}
                value={(inputs[builtInCoach.slots[1].name] ?? '').toString()}
                onChangeText={(t) => setInputs((p) => ({ ...p, [builtInCoach.slots[1].name]: t }))}
                editable={!isRefining}
                multiline
                numberOfLines={4}
              />
              <MagicWandButton
                onPress={() => handleMagicWandPress(builtInCoach.slots[1].name, 'context')}
                loading={isRefining === builtInCoach.slots[1].name}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{builtInCoach.lever.name}</Text>
            <View style={styles.leverRow}>
              <Text style={styles.leverLabel}>{builtInCoach.lever.minLabel}</Text>
              <View style={styles.leverButtons}>
                {[0, 25, 50, 75, 100].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.leverButton, leverValue === v && styles.leverButtonActive]}
                    onPress={() => setLeverValue(v)}
                  >
                    <Text style={[styles.leverButtonText, leverValue === v && styles.leverButtonTextActive]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.leverLabel}>{builtInCoach.lever.maxLabel}</Text>
            </View>
          </View>
        </View>
      ) : (
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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (inputKey.trim()) {
                  setInputs((prev) => ({ ...prev, [inputKey.trim()]: inputValue.trim() || inputValue }));
                  setInputKey('');
                  setInputValue('');
                }
              }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {Object.entries(inputs).map(([key, value]) => (
            <View key={key} style={styles.inputItem}>
              <Text style={styles.inputItemKey}>{key}:</Text>
              <Text style={styles.inputItemValue}>{String(value)}</Text>
              <TouchableOpacity style={styles.removeButton} onPress={() => setInputs((p) => { const n = { ...p }; delete n[key]; return n; })}>
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {validationPrompt && (
        <View style={styles.validationPrompt}>
          <Text style={styles.validationText}>{validationPrompt.placeholder}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guidance</Text>
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.runButton, isRunDisabled && styles.runButtonDisabled]}
        onPress={handleRun}
        disabled={isRunDisabled}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.runButtonText}>
            {mustUpgrade
              ? 'Upgrade to Pro'
              : showLimitWarning
                ? 'Sign In to Continue'
                : 'Generate Coach'}
          </Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {output && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guidance</Text>
          <View style={styles.outputHeroCard}>
            <Markdown style={markdownStyles} debugPrintTree={false}>
              {normalizeMarkdownOutput(output)}
            </Markdown>
          </View>
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.resultIconButton}
              onPress={handleCopy}
              disabled={copied}
            >
              <Ionicons name="copy-outline" size={24} color={theme.colors.accent} />
              <Text style={styles.resultIconLabel}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resultIconButton}
              onPress={handleSend}
              disabled={loading}
            >
              <Ionicons name="share-outline" size={24} color={theme.colors.accent} />
              <Text style={styles.resultIconLabel}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resultIconButton} onPress={handleRunAgain}>
              <Ionicons name="refresh-outline" size={24} color={theme.colors.accent} />
              <Text style={styles.resultIconLabel}>Regenerate</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.saveLink} onPress={handleSave}>
            <Text style={styles.saveLinkText}>Save to library</Text>
          </TouchableOpacity>
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackLabel}>Was this helpful?</Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => setFeedbackHelpful((prev) => (prev === 'helpful' ? null : 'helpful'))}
              >
                <Ionicons
                  name={feedbackHelpful === 'helpful' ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={20}
                  color={feedbackHelpful === 'helpful' ? theme.colors.accent : theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => setFeedbackHelpful((prev) => (prev === 'not-helpful' ? null : 'not-helpful'))}
              >
                <Ionicons
                  name={feedbackHelpful === 'not-helpful' ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={20}
                  color={feedbackHelpful === 'not-helpful' ? theme.colors.accent : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.footerHint}>Small steps beat perfect plans.</Text>
        </View>
      )}

      {promptDebug && __DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prompt Debug</Text>
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>{promptDebug}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const markdownStyles = {
  body: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
  heading1: { fontSize: 20, fontWeight: '700' as const, color: theme.colors.text, marginTop: 12, marginBottom: 6 },
  heading2: { fontSize: 17, fontWeight: '600' as const, color: theme.colors.text, marginTop: 10, marginBottom: 4 },
  heading3: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text, marginTop: 8, marginBottom: 4 },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  list_item: { marginBottom: 2 },
  strong: { fontWeight: '700' as const, color: theme.colors.text },
  paragraph: { marginBottom: 6 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
  header: { marginBottom: theme.spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xs },
  headerActions: { flexDirection: 'row', gap: theme.spacing.sm },
  headerActionButton: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm },
  headerActionText: { ...theme.typography.bodySmall, color: theme.colors.accent, fontWeight: '600' },
  headerDeleteButton: {},
  headerDeleteText: { ...theme.typography.bodySmall, color: theme.colors.error, fontWeight: '600' },
  title: { ...theme.typography.h2, color: theme.colors.text, flex: 1 },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  runCount: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  limitWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  limitWarningText: { ...theme.typography.body, color: '#92400E', marginBottom: theme.spacing.sm },
  upgradeButton: { backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, alignItems: 'center' },
  upgradeButtonText: { ...theme.typography.body, color: theme.colors.background, fontWeight: '600' },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  field: { marginBottom: theme.spacing.md },
  label: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600', marginBottom: theme.spacing.xs },
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  leverRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  leverLabel: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, width: 60 },
  leverButtons: { flex: 1, flexDirection: 'row', gap: theme.spacing.xs },
  leverButton: { flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.sm },
  leverButtonActive: { backgroundColor: theme.colors.accent },
  leverButtonText: { ...theme.typography.bodySmall, color: theme.colors.text },
  leverButtonTextActive: { color: theme.colors.background, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  inputKey: { flex: 2 },
  inputValue: { flex: 3, minHeight: 40 },
  addButton: { backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, justifyContent: 'center' },
  addButtonText: { ...theme.typography.body, color: theme.colors.background, fontWeight: '600' },
  inputItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  inputItemKey: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600', marginRight: theme.spacing.xs },
  inputItemValue: { ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 },
  removeButton: { padding: theme.spacing.xs },
  removeButtonText: { ...theme.typography.h2, color: theme.colors.error, fontSize: 24 },
  validationPrompt: { marginBottom: theme.spacing.sm },
  validationText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, fontStyle: 'italic' },
  runButton: { backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.md },
  runButtonDisabled: { opacity: 0.5 },
  runButtonText: { ...theme.typography.body, color: theme.colors.background, fontWeight: '600' },
  skeletonCard: {
    backgroundColor: theme.colors.accentLightBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    minHeight: 140,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
    opacity: 0.6,
  },
  skeletonLineShort: { width: '80%' },
  errorContainer: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: theme.colors.error, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorText: { ...theme.typography.body, color: theme.colors.error },
  progressStepper: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: theme.colors.accent,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inputWithIcon: { position: 'relative' },
  outputHeroCard: {
    backgroundColor: theme.colors.accentLightBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  resultIconButton: {
    alignItems: 'center',
    minWidth: 56,
  },
  resultIconLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  saveLink: { alignItems: 'center', marginTop: theme.spacing.sm },
  saveLinkText: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  feedbackSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  feedbackLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  feedbackButtons: { flexDirection: 'row', gap: theme.spacing.md },
  feedbackButton: { padding: theme.spacing.xs },
  footerHint: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.lg, fontStyle: 'italic', textAlign: 'center' },
  debugContainer: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
  debugText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, fontFamily: 'monospace' },
  backButton: { marginTop: theme.spacing.md },
  backButtonText: { ...theme.typography.body, color: theme.colors.accent, fontWeight: '600' },
});
