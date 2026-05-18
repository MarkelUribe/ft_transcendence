// src/lib/api/chess.ts
const BASE_URL = 'https://localhost:3000';

export async function getExistingGame(token: string) {
  try {
    const res = await fetch(`https://localhost:3000/game/player`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) return null;

    return await res.json().catch(() => null);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export class ChessAPI {
  token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetchJSON(url: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // 👇 Handle empty responses properly
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  joinQueue(playerId: string) {
    return this.fetchJSON('/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify({ playerId })
    });
  }

  leaveQueue(playerId: string) {
    return this.fetchJSON('/matchmaking/leave', {
      method: 'POST',
      body: JSON.stringify({ playerId })
    });
  }

  getQueueStatus(playerId: string) {
    return this.fetchJSON(`/matchmaking/status/${playerId}`);
  }

  getGameByPlayer(playerId: string) {
    return this.fetchJSON(`/game/player/${playerId}`);
  }

  getGame(gameId: string) {
    return this.fetchJSON(`/game/${gameId}`);
  }

  getMe() {
    return this.fetchJSON(`/auth/me`);
  }

  makeMove(gameId: string, from: string, to: string) {
    return this.fetchJSON(`/game/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify({ from, to })
    });
  }
}
