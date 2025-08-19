import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthTokenUtil {
    static async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.warn("Token not found in storage.");
                return null;
            }
            return token;
        } catch (err) {
            console.error("Failed to read token:", err);
            return null;
        }
    }

    static async setToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem('userToken', token);
        } catch (err) {
            console.error("Failed to save token:", err);
        }
    }

    static async clearToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem('userToken');
        } catch (err) {
            console.error("Failed to clear token:", err);
        }
    }
}
