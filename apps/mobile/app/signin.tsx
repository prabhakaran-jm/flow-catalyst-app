import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { theme } from '@/theme';
import { useSupabase } from '@/src/providers/SupabaseProvider';

export default function SignIn() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signInWithOtp, verifyOtp, user, loading: authLoading } = useSupabase();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Check for error from callback
  useEffect(() => {
    const errorParam = params.error as string | undefined;
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      if (decodedError === 'expired' || decodedError.toLowerCase().includes('expired')) {
        setError('Your code has expired. Please request a new one.');
      } else {
        setError(decodedError);
      }
    }
  }, [params]);

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  // Don't render if already signed in (redirecting)
  if (user) {
    return null;
  }

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithOtp(email.trim());
      
      if (error) {
        // Handle rate limit errors with a more user-friendly message
        const errorMessage = error.message?.toLowerCase() || String(error).toLowerCase();
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          setError(
            'Too many requests. Please wait a few minutes before requesting another code.'
          );
        } else {
          // Better error message handling
          const message = error.message || error.toString() || JSON.stringify(error) || 'Failed to send verification code';
          console.error('Supabase auth error:', error);
          setError(message);
        }
      } else {
        setEmailSent(true);
        Alert.alert(
          'Code Sent',
          __DEV__
            ? 'Check Mailpit (http://127.0.0.1:54324) for your verification code.'
            : 'Check your email for the verification code and enter it below.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      // Better error handling for unexpected errors
      console.error('Unexpected error sending verification code:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : JSON.stringify(err) || 'Failed to send verification code. Check console for details.';

      if (errorMessage.toLowerCase().includes('rate limit')) {
        setError(
          'Too many requests. Please wait a few minutes before requesting another code.'
        );
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        setError('Network error. Make sure Supabase is running locally (npx supabase start)');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.trim().replace(/\s/g, '');
    if (!code) {
      setError('Please enter the code from your email');
      return;
    }
    // Supabase may send 6 or 8 digit tokens depending on config
    if (code.length < 6 || code.length > 10 || !/^\d+$/.test(code)) {
      setError('Please enter the full numeric code from your email (6-10 digits)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await verifyOtp(email.trim(), code);
      if (verifyError) {
        const msg = verifyError.message || verifyError.name || 'Invalid code';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
          setError('This code has expired or is invalid. Please request a new one.');
        } else {
          setError(msg);
        }
      }
      // Success: onAuthStateChange will update user, useEffect will redirect to /
    } catch (err) {
      console.error('Unexpected error verifying OTP:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setOtpCode('');
    setError(null);
    router.setParams({ error: undefined });
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Flow Catalyst</Text>
              <Text style={styles.subtitle}>
                {emailSent
                  ? 'Enter the code from your email to sign in'
                  : 'Enter your email to get started'}
              </Text>
            </View>

            {!emailSent ? (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                      if (params.error) router.setParams({ error: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.emailSentContainer}>
                  <Text style={styles.emailSentText}>
                    We've sent a verification code to:
                  </Text>
                  <Text style={styles.emailAddress}>{email}</Text>
                  <Text style={styles.emailSentHint}>
                    Enter the 8-digit code from your email below. It may take 1–2
                    minutes to arrive; check spam if you don't see it.
                    {'\n\n'}
                    Codes expire after 1 hour. If expired, tap "Resend Code"
                    below.
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Verification Code</Text>
                  <Text style={styles.hint}>
                    Enter the 8-digit code from your email
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter code"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={otpCode}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, '').slice(0, 10);
                      setOtpCode(cleaned);
                      setError(null);
                      if (cleaned.length >= 8 && !loading) {
                        Keyboard.dismiss();
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading || otpCode.length < 8}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleResendEmail();
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleResendEmail();
                  }}
                >
                  <Text style={styles.linkButtonText}>Use Different Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissKeypadButton}
                  onPress={dismissKeyboard}
                >
                  <Text style={styles.dismissKeypadText}>Dismiss keypad</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: 400,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
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
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  linkButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
  dismissKeypadButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  dismissKeypadText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
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
  errorHint: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorHintContainer: {
    marginTop: theme.spacing.xs,
  },
  emailSentContainer: {
    backgroundColor: theme.colors.accentLightBackground,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  emailSentText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emailAddress: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  emailSentHint: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
