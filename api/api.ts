import axios from "axios";

export class APICall {

    private static BASE_URL = 'https://barug-dev.onrender.com'

    static async post(url: string, payload: object, token: string) {
        try {
            const response = await axios.post(this.BASE_URL + url, payload, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async get(url: string, payload: object, token: string) {
        try {
            const response = await axios.get(this.BASE_URL + url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                },
                params: payload
            })
            return response.data
        } catch(error) {
            throw error;
        }
    }

}