const BASE_URL = 'http://localhost:3000';

export class FriendsAPI {
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
        // ignore JSON parse errors and fall back to generic message
      }
      throw new Error(message);
    }

    return text ? JSON.parse(text) : null;
  }

  getFriends() {
    return this.fetchJSON('/friends');
  }

  getPendingRequests() {
    return this.fetchJSON('/friends/requests');
  }

  sendFriendRequest(targetUserId: number) {
    return this.fetchJSON('/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  acceptFriendRequest(requestId: number) {
    return this.fetchJSON(`/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  }

  rejectFriendRequest(requestId: number) {
    return this.fetchJSON(`/friends/requests/${requestId}/reject`, {
      method: 'POST',
    });
  }
}
