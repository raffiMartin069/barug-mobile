export type GeolocationType = {
    houseNumber: string;
    street: string;
    purokSitio: string;
    barangay: string;
    city: string;
    setHouseNumber: (value: string) => void;
    setStreet: (value: string) => void;
    setPurokSitio: (value: string) => void;
    setBarangay: (value: string) => void;
    setCity: (value: string) => void;
    getFullAddress: () => string;
    clear: () => void;
}