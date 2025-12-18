export type GeolocationType = {
    houseNumber: string;
    street: string;
    purokSitio: string;
    purokSitioCode: string;
    barangay: string;
    city: string;
    lat: string;
    lng: string
    setHouseNumber: (value: string) => void;
    setStreet: (value: string) => void;
    setPurokSitio: (value: string) => void;
    setPurokSitioCode: (value: string) => void;
    setBarangay: (value: string) => void;
    setCity: (value: string) => void;
    setLat: (value: string) => void;
    setLng: (value: string) => void;
    getFullAddress: () => string;
    clear: () => void;
}