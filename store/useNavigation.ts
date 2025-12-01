import { create } from 'zustand';

export interface NavigationState {
  from: string | null;
    to: string | null;
    setFrom: (value: string | null) => void;
    setTo: (value: string | null) => void;
    reset: () => void;
}

export const useNavigationStore = create<NavigationState>((set): NavigationState => ({
    from: null,
    to: null,
    setFrom: (value: string | null) => set({ from: value }),
    setTo: (value: string | null) => set({ to: value }),
    reset: () => set({ from: null, to: null }),
}));