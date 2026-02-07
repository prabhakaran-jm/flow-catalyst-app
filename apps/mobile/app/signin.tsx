import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

  // Check for error from callback (e.g., expired link)
  useEffect(() => {
    const errorParam = params.error as string | undefined;
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      if (decodedError === 'expired' || decodedError.toLowerCase().includes('expired')) {
        setError('This magic link has expired. Please request a new one.');
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
            'Too many requests. Please wait a few minutes before requesting another magic link. ' +
            'If you already received an email, check your inbox and click the link.'
          );
        } else {
          // Better error message handling
          const message = error.message || error.toString() || JSON.stringify(error) || 'Failed to send magic link';
          console.error('Supabase auth error:', error);
          setError(message);
        }
      } else {
        setEmailSent(true);
        Alert.alert(
          'Email Sent',
          __DEV__
            ? 'Check Mailpit (http://127.0.0.1:54324) for your magic link. Click the link to sign in.'
            : 'Check your email for the magic link. Click the link to sign in, or enter the code below.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      // Better error handling for unexpected errors
      console.error('Unexpected error sending magic link:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
        ? err 
        : JSON.stringify(err) || 'Failed to send magic link. Check console for details.';
      
      if (errorMessage.toLowerCase().includes('rate limit')) {
        setError(
          'Too many requests. Please wait a few minutes before requesting another magic link.'
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
          setError('This code has expired. Please request a new magic link.');
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Flow Catalyst</Text>
          <Text style={styles.subtitle}>
            {emailSent
              ? 'Check your email and click the magic link to sign in'
              : 'Enter your email to get started'}
          </Text>
        </View>

        {!emailSent ? (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.hint}>
                Note: Rate limits are per email address. Try a different email if you hit the limit.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                  // Clear URL error params when user starts typing
                  if (params.error) {
                    router.setParams({ error: undefined });
                  }
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
                {error.toLowerCase().includes('rate limit') && (
                  <View style={styles.errorHintContainer}>
                    <Text style={styles.errorHint}>
                      💡 Solutions:
                    </Text>
                    <Text style={styles.errorHint}>
                      • Check your email inbox for an existing magic link
                    </Text>
                    <Text style={styles.errorHint}>
                      • Try a different email address
                    </Text>
                    <Text style={styles.errorHint}>
                      • Wait 1 hour for the rate limit to reset
                    </Text>
                    <Text style={styles.errorHint}>
                      • If you have a magic link URL, paste it in your browser's address bar
                    </Text>
                  </View>
                )}
                {error.toLowerCase().includes('expired') && (
                  <Text style={styles.errorHint}>
                    💡 Magic links expire after 1 hour. Request a new one to continue.
                  </Text>
                )}
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
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.emailSentContainer}>
              <Text style={styles.emailSentText}>
                We've sent a magic link to:
              </Text>
              <Text style={styles.emailAddress}>{email}</Text>
              <Text style={styles.emailSentHint}>
                Click the link in your email to sign in, or enter the code below (recommended for emulator).
                {'\n\n'}
                ⚠️ Magic links expire after 1 hour. If your link expired, click "Resend Email" below.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Or enter the code from your email</Text>
              <Text style={styles.hint}>
                Enter the numeric code from your email (usually 6-8 digits)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor={theme.colors.textSecondary}
                value={otpCode}
                onChangeText={(text) => {
                  setOtpCode(text.replace(/\D/g, '').slice(0, 10));
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={10}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || otpCode.length < 6}
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
              style={styles.button}
              onPress={handleResendEmail}
            >
              <Text style={styles.buttonText}>Resend Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleResendEmail}
            >
              <Text style={styles.linkButtonText}>Use Different Email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
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
  linkButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  linkButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
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
    backgroundColor: '#F0F9FF',
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
