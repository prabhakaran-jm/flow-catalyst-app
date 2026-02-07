import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANONYMOUS_RUNS_KEY = '@flow_catalyst:anonymous_runs_used';
const PROFILE_NUDGE_KEY = '@flow_catalyst:profile_nudge_seen';

interface AppState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  anonymousRunsUsed: number;
  loadAnonymousRunsUsed: () => Promise<void>;
  incrementAnonymousRunsUsed: () => Promise<void>;
  hasSeenProfileNudge: boolean;
  setHasSeenProfileNudge: () => Promise<void>;
  loadHasSeenProfileNudge: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (value: boolean) =>
    set({ hasCompletedOnboarding: value }),
  anonymousRunsUsed: 0,
  loadAnonymousRunsUsed: async () => {
    try {
      const v = await AsyncStorage.getItem(ANONYMOUS_RUNS_KEY);
      set({ anonymousRunsUsed: parseInt(v || '0', 10) });
    } catch {
      set({ anonymousRunsUsed: 0 });
    }
  },
  incrementAnonymousRunsUsed: async () => {
    const next = get().anonymousRunsUsed + 1;
    await AsyncStorage.setItem(ANONYMOUS_RUNS_KEY, String(next));
    set({ anonymousRunsUsed: next });
  },
  hasSeenProfileNudge: false,
  setHasSeenProfileNudge: async () => {
    await AsyncStorage.setItem(PROFILE_NUDGE_KEY, '1');
    set({ hasSeenProfileNudge: true });
  },
  loadHasSeenProfileNudge: async () => {
    const v = await AsyncStorage.getItem(PROFILE_NUDGE_KEY);
    set({ hasSeenProfileNudge: v === '1' });
  },
}));
