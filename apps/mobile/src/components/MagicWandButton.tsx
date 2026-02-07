import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface MagicWandButtonProps {
  onPress: () => void | Promise<void>;
  loading?: boolean;
}

const MagicWandButton: React.FC<MagicWandButtonProps> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={styles.iconWrapper}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        ) : (
          <Ionicons name="sparkles" size={18} color="#6366F1" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#F0F5FF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconWrapper: {
    ...(Platform.OS !== 'web' && {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    }),
  },
});

export default MagicWandButton;
