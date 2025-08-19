import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthTokenUtil {
    static async getToken(): Promise<string | null> {
        let token = await AsyncStorage.getItem('userToken');
        if(token === null) {
            console.warn('Token is not set.')
            return null;
        }
        return token;
    }
}