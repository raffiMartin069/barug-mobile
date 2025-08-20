import { create } from "zustand"

export const useTextSearch = create((set) => ({
    searchTexts: {},
    setSearchText: (key, text) => set((state) => ({
            searchTexts: { ...state.searchTexts, [key]: text },
        })),
    clearSearchText: (key) =>
        set((state) => ({
            searchTexts: { ...state.searchTexts, [key]: "" },
        })),
}))