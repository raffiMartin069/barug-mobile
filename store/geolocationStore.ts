import { GeolocationType } from "@/types/geolocation";
import { create } from "zustand";

export const useGeolocationStore = create<GeolocationType & {
    setHouseNumber: (value: string) => void;
    setStreet: (value: string) => void;
    setPurokSitio: (value: string) => void;
    setBarangay: (value: string) => void;
    setCity: (value: string) => void;
    getFullAddress: () => string;
}>((set, get) => ({
    houseNumber: '',
    street: '',
    purokSitio: '',
    barangay: '',
    city: '',
    setHouseNumber: (value: string) => set({ houseNumber: value }),
    setStreet: (value: string) => set({ street: value }),
    setPurokSitio: (value: string) => set({ purokSitio: value }),
    setBarangay: (value: string) => set({ barangay: value }),
    setCity: (value: string) => set({ city: value }),
    getFullAddress: () => {
        const state = get();
        if(!state.houseNumber || !state.street || !state.purokSitio || !state.barangay || !state.city) {
            return '';
        }
        return `${state.houseNumber}, ${state.street}, ${state.purokSitio}, ${state.barangay}, ${state.city}`;
    },
    clear: () => set({
        houseNumber: '',
        street: '',
        purokSitio: '',
        barangay: '',
        city: '',
    })
}));
