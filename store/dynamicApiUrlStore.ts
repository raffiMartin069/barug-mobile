import { create } from "zustand";


export const useDynamicURL = create((set) => ({
    url:  null,
    setUrl: (newUrl: string) => set({ url: newUrl }),
    clearUrl: () => set({ url: "" })
}))