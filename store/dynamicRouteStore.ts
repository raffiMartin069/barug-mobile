import { create } from "zustand";

const useDynamicRouteStore = create((set) => ({
    currentRoute: '',
    setCurrentRoute: (route) => set({ currentRoute: route }),
    clearRoute: () => set({ currentRoute: '' })
}));

export default useDynamicRouteStore;
