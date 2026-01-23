import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '@/theme';

export default function CatalystDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Run Catalyst</Text>
        <Text style={styles.id}>ID: {id}</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Catalyst execution screen placeholder
        </Text>
        <Text style={styles.placeholderSubtext}>
          This screen will display the step-by-step workflow for running a catalyst.
        </Text>
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
  placeholder: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  placeholderText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  placeholderSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
