import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANONYMOUS_RUNS_KEY = '@flow_catalyst:anonymous_runs_used';
const PROFILE_NUDGE_KEY = '@flow_catalyst:profile_nudge_seen';
const SAVED_RESULTS_KEY = 'saved_results';
const ONBOARDING_KEY = '@flow_catalyst:onboarding_completed';

export interface SavedResult {
  id: string;
  coachId: string;
  coachTitle: string;
  output: string;
  createdAt: string;
  inputs: Record<string, any>;
  leverValue?: number;
}

interface AppState {
  hasCompletedOnboarding: boolean;
  onboardingLoaded: boolean;
  loadHasCompletedOnboarding: () => Promise<void>;
  setHasCompletedOnboarding: (value: boolean) => void;
  anonymousRunsUsed: number;
  loadAnonymousRunsUsed: () => Promise<void>;
  incrementAnonymousRunsUsed: () => Promise<void>;
  hasSeenProfileNudge: boolean;
  setHasSeenProfileNudge: () => Promise<void>;
  loadHasSeenProfileNudge: () => Promise<void>;
  savedResults: SavedResult[];
  loadSavedResults: () => Promise<void>;
  saveResult: (result: Omit<SavedResult, 'id' | 'createdAt'>) => Promise<SavedResult>;
  deleteSavedResult: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  hasCompletedOnboarding: false,
  onboardingLoaded: false,
  loadHasCompletedOnboarding: async () => {
    try {
      const v = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ hasCompletedOnboarding: v === '1', onboardingLoaded: true });
    } catch {
      set({ onboardingLoaded: true });
    }
  },
  setHasCompletedOnboarding: (value: boolean) => {
    AsyncStorage.setItem(ONBOARDING_KEY, value ? '1' : '0');
    set({ hasCompletedOnboarding: value });
  },
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
  savedResults: [],
  loadSavedResults: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_RESULTS_KEY);
      const list: SavedResult[] = raw ? JSON.parse(raw) : [];
      set({ savedResults: list });
    } catch {
      set({ savedResults: [] });
    }
  },
  saveResult: async (result) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const createdAt = new Date().toISOString();
    const full: SavedResult = { ...result, id, createdAt };
    const next = [full, ...get().savedResults];
    await AsyncStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(next));
    set({ savedResults: next });
    return full;
  },
  deleteSavedResult: async (id) => {
    const next = get().savedResults.filter((r) => r.id !== id);
    await AsyncStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(next));
    set({ savedResults: next });
  },
}));
