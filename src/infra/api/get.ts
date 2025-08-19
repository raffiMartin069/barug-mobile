import axios from "axios";

export const getRequest = async <T>(
    url: string,
    params: any,
    token: string
): Promise<T> => {
    const response = await axios.get<T>(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
        },
        params: { q: params },
    });
    return response.data;
};
