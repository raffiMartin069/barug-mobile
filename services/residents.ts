// services/residents.ts
export async function searchResidents(q: string, token: string) {
  const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/lupon_mem/mobile/residents/search/?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`, // remove if AllowAny
    },
  });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }
  return res.json() as Promise<{results: {person_id:number; name:string; address:string|null}[]}>;
}
