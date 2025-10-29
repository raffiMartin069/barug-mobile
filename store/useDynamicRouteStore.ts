import { create } from 'zustand'

/* 
    Gamita ni kung ganahan ka mu navigate ug lain screen unya mu balik sa 
    previous nga screen after nimo ma update ang data sa lain screen.
*/

interface DynamicRouteState {
    returnTo: string
    setReturnTo: (path: string) => void
    clearReturnTo: () => void
}

export const useDynamicRouteStore = create<DynamicRouteState>((set) => ({
    returnTo: '',
    setReturnTo: (path) => set(() => ({ returnTo: path })),
    clearReturnTo: () => set(() => ({ returnTo: '' })),
}))