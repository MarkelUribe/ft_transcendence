<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { io, type Socket } from "socket.io-client";
  import { onDestroy } from "svelte";
  import { page } from "$app/stores";

  type HistoryGame = {
    gameId: string;
    white: {
      id: number;
      username: string;
      avatarUrl: string | null;
      elo: number;
    };
    black: {
      id: number;
      username: string;
      avatarUrl: string | null;
      elo: number;
    };
    status: string; // 'active' | 'checkmate' | 'stalemate' ...
    looser: number; // -1 draw, otherwise loser userId
    createdAt: string;
    updatedAt: string;
  };

  let statsLoading = true;
  let statsError: string | null = null;
  let stats = {
    played: 0,
    finished: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    active: 0,
  };

  let statsSocket: Socket | null = null;

  function computeStats(games: HistoryGame[], myId: number) {
    const played = games.length;
    const active = games.filter((g) => g.status === "active").length;
    const finishedGames = games.filter((g) => g.status !== "active");
    const finished = finishedGames.length;

    const wins = finishedGames.filter(
      (g) => g.looser !== -1 && g.looser !== myId,
    ).length;
    const losses = finishedGames.filter((g) => g.looser === myId).length;
    const draws = finishedGames.filter((g) => g.looser === -1).length;

    const winRate = finished ? wins / finished : 0;

    return { played, finished, wins, draws, losses, winRate, active };
  }

  const BACKEND_URL = "https://localhost:3000";

  type PublicProfile = {
    id: number;
    username: string;
    avatarUrl: string | null;
    elo?: number | null;
  };

  let user: PublicProfile | null = null;
  let targetUserId: number | null = null;
  let loading = true;
  let error: string | null = null;

  function getToken() {
    if (!browser) return null;
    return localStorage.getItem("token");
  }

  onMount(async () => {
    const token = getToken();
    if (!token) {
      goto("/login");
      return;
    }

    const param = Number($page.params.userId);
    if (!Number.isFinite(param)) {
      error = "Invalid user id";
      loading = false;
      statsLoading = false;
      return;
    }

    const myId = Number(localStorage.getItem("id"));
    if (Number.isFinite(myId) && myId === param) {
      goto("/profile");
      return;
    }

    const requestedUserId = param;
    targetUserId = requestedUserId;

    try {
      const res = await fetch(`${BACKEND_URL}/users/${requestedUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        error = "User not found";
        return;
      }

      if (!res.ok) {
        error = "Failed to load profile";
        return;
      }

      user = await res.json();
    } catch {
      error = "Network error while loading profile";
    } finally {
      loading = false;
    }

    if (!user) {
      statsLoading = false;
      return;
    }

    statsLoading = true;
    statsError = null;

    statsSocket = io(BACKEND_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    statsSocket.on("connect", () => {
      statsSocket?.emit("getMatchHistory", { userId: requestedUserId, limit: 50 });
    });

    statsSocket.on("matchHistory", (payload: { games: HistoryGame[] }) => {
      stats = computeStats(payload.games ?? [], requestedUserId);
      statsLoading = false;
    });

    // important: if socket can’t connect, stop “Loading…”
    statsSocket.on("connect_error", (err: Error) => {
      statsError = err.message;
      statsLoading = false;
    });

    statsSocket.on("error", (payload: { message?: string }) => {
      statsError = payload?.message ?? "Unable to load stats.";
      statsLoading = false;
    });
  });

  onDestroy(() => {
    statsSocket?.disconnect();
    statsSocket = null;
  });
</script>

<div class="page-container">
  {#if loading}
    <div class="profile-card"><p>Loading profile...</p></div>
  {:else}
    <div class="profile-grid">
      <div class="profile-card">
        <h1 style="margin: 0 0 0.5rem 0;">Stats</h1>
        {#if statsLoading}
          <p>Loading stats...</p>
        {:else if statsError}
          <p class="error-text">{statsError}</p>
        {:else if user}
          <p class="subtitle">Last 50 matches</p>

          <div class="stats-list">
            <div class="stat-row">
              <span>ELO</span><strong>{user.elo ?? 0}</strong>
            </div>
            <div class="stat-row">
              <span>Matches</span><strong>{stats.played}</strong>
            </div>
            <div class="stat-row">
              <span>Finished</span><strong>{stats.finished}</strong>
            </div>
            <div class="stat-row">
              <span>Wins</span><strong>{stats.wins}</strong>
            </div>
            <div class="stat-row">
              <span>Draws</span><strong>{stats.draws}</strong>
            </div>
            <div class="stat-row">
              <span>Losses</span><strong>{stats.losses}</strong>
            </div>
            <div class="stat-row">
              <span>Win rate</span><strong
                >{Math.round(stats.winRate * 100)}%</strong
              >
            </div>
            <div class="stat-row">
              <span>Active games</span><strong>{stats.active}</strong>
            </div>
          </div>
        {/if}
      </div>

      <div class="profile-card">
        {#if error}
          <p class="error-text">{error}</p>
        {/if}

        {#if user}
          <h1>Profile</h1>
          <p class="subtitle">Public profile</p>

          <div class="avatar-wrapper">
            <img
              src={user.avatarUrl
                ? `${BACKEND_URL}${user.avatarUrl}`
                : "/pieces/default-avatar.png"}
              alt=""
            />
          </div>

          <div class="stats-list">
            <div class="stat-row">
              <span>Username</span><strong>{user.username}</strong>
            </div>
            <div class="stat-row">
              <span>User ID</span><strong>{user.id}</strong>
            </div>
          </div>
        {:else}
          <p>No user data.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page-container {
    min-height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .profile-card {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 2rem 2.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-width: 320px;
    max-width: 420px;
    position: relative;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
  }

  .avatar-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  }

  .avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .error-text {
    color: #ffb3b3;
    font-size: 0.9rem;
  }

  .subtitle {
    font-size: 0.95rem;
    opacity: 0.8;
  }
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .stats-list {
    width: 100%;
    display: grid;
    gap: 0.6rem;
    margin-top: 0.8rem;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0.7rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
  }

  @media (max-width: 900px) {
    .profile-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
