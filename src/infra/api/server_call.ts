import axios from "axios";

export class APICaller {

    private static BASE_URL = 'https://barug-dev.onrender.com'

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
            throw new Error(`Error fetching data from ${error.message}`);
        }
    }

}