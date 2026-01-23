import AsyncStorage from '@react-native-async-storage/async-storage';

const RUNS_STORAGE_KEY = '@flow_catalyst:daily_runs';
const RUNS_DATE_KEY = '@flow_catalyst:runs_date';

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get the number of runs today for free users
 */
export async function getTodayRunCount(): Promise<number> {
  try {
    const storedDate = await AsyncStorage.getItem(RUNS_DATE_KEY);
    const today = getTodayDateString();

    // If it's a new day, reset the count
    if (storedDate !== today) {
      await AsyncStorage.setItem(RUNS_DATE_KEY, today);
      await AsyncStorage.setItem(RUNS_STORAGE_KEY, '0');
      return 0;
    }

    // Get current count
    const countStr = await AsyncStorage.getItem(RUNS_STORAGE_KEY);
    return parseInt(countStr || '0', 10);
  } catch (error) {
    console.error('Error getting run count:', error);
    return 0;
  }
}

/**
 * Increment the daily run count
 */
export async function incrementRunCount(): Promise<number> {
  try {
    const currentCount = await getTodayRunCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(RUNS_STORAGE_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing run count:', error);
    return 0;
  }
}

/**
 * Check if free user has reached daily limit (3 runs)
 */
export async function hasReachedDailyLimit(): Promise<boolean> {
  const count = await getTodayRunCount();
  return count >= 3;
}

/**
 * Reset daily run count (useful for testing or admin)
 */
export async function resetDailyRunCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RUNS_STORAGE_KEY);
    await AsyncStorage.removeItem(RUNS_DATE_KEY);
  } catch (error) {
    console.error('Error resetting run count:', error);
  }
}
