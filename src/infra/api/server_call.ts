import axios from "axios";

export class APICaller {

    private static BASE_URL = 'https://barug-dev.onrender.com'

    static async post(url: string, payload: object, token: string) {
        try {
            const response = await axios.post(this.BASE_URL + url, payload, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });
            return response;
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
            return response
        } catch(error) {
            throw new Error(`Error fetching data from ${error.message}`);
        }
    }

}