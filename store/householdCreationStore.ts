import { create } from "zustand"

/**
 * Zustand store for managing household creation state.
 *
 * @property {string} houseNumber - The house number of the household address.
 * @property {string} street - The street name of the household address.
 * @property {string} sitio - The sitio of the household address.
 * @property {string} barangay - The barangay of the household address.
 * @property {string} city - The city of the household address.
 * @property {string} houseType - The type of the house (e.g., apartment, detached).
 * @property {string} houseOwnership - The ownership status of the house (e.g., owned, rented).
 * @property {string} message - A message related to household creation, such as status or error.
 * @method setAddress - Updates the address fields (houseNumber, street, sitio, barangay, city).
 * @param {string} houseNumber - The new house number.
 * @param {string} street - The new street name.
 * @param {string} sitio - The new sitio.
 * @param {string} barangay - The new barangay.
 * @param {string} city - The new city.
 * @method setHouseType - Sets the type of the house.
 * @param {string} houseType - The new house type.
 * @method setHouseOwnership - Sets the ownership status of the house.
 * @param {string} houseOwnership - The new house ownership status.
 * @method setMessage - Sets the message field.
 * @param {string} message - The new message.
 * @method clearAddress - Clears all address fields (houseNumber, street, sitio, barangay, city).
 */
export const householdCreationStore = create((set) =>({
    houseNumber: '',
    street: '',
    sitio: '',
    barangay: '',
    city: '',
    houseType: '',
    houseOwnership: '',
    message: '',
    setAddress: (houseNumber, street, sitio, barangay, city) => set({ houseNumber, street, sitio, barangay, city }),
    setHouseType: (houseType) => set({ houseType }),
    setHouseOwnership: (houseOwnership) => set({ houseOwnership }),
    setMessage: (message) => set({ message }),
    clearAddress: () => set({ houseNumber: '', street: '', sitio: '', barangay: '', city: '' })
}))