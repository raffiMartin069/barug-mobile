import { create } from "zustand"

export const useDropdownValueStore = create((set) => ({
  value: "",
  setValue: (val) => set({ value: val }),
  clearValue: () => set({ value: null }),
}))
