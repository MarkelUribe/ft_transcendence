const BASE_URL = import.meta.env.VITE_API_URL;

export type RankingUser = {
  id: number;
  username: string;
  avatarUrl?: string | null;
  elo?: number | null;
};

async function fetchJSON(url: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = text ? JSON.parse(text) : null;
      if (data && typeof data.message === 'string') {
        message = data.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return text ? JSON.parse(text) : null;
}

export async function getTopByElo(n: number, token?: string | null): Promise<RankingUser[]> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const data = await fetchJSON(`/users/ranking/${n}`, { headers });
  return Array.isArray(data) ? (data as RankingUser[]) : [];
}
