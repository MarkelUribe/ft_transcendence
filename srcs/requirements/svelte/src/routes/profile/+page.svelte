<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { io, type Socket } from "socket.io-client";
  import { onDestroy } from "svelte";

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

  let user: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    elo?: number | null;
    createdAt?: string; // will be "—" until backend supports it
  } | null = null;

  let email = "";
  let avatarFile: File | null = null;
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

    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        goto("/login");
        return;
      }
      if (!res.ok) {
        error = "Failed to load profile";
        return;
      }

      user = await res.json();
      email = user?.email ?? "";
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
      statsSocket?.emit("getMatchHistory", { userId: user!.id, limit: 50 });
    });

    statsSocket.on("matchHistory", (payload: { games: HistoryGame[] }) => {
      stats = computeStats(payload.games ?? [], user!.id);
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

  async function saveProfile() {
    if (!user) return;
    error = null;

    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      error = "Failed to update profile";
      return;
    }

    user = await res.json();
  }

  async function uploadAvatar() {
    if (!avatarFile) return;
    error = null;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    const res = await fetch(`${BACKEND_URL}/users/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    if (!res.ok) {
      error = "Failed to upload avatar";
      return;
    }

    user = await res.json();
  }
</script>

<div class="page-container">
  {#if loading}
    <div class="profile-card"><p>Loading profile...</p></div>
  {:else}
    <div class="profile-grid">
      <div class="profile-card">
        <h1 style="margin: 0 0 0.5rem 0;">My Stats</h1>
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
            <div class="stat-row">
              <span>Member since</span><strong
                >{user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}</strong
              >
            </div>
          </div>
        {/if}
      </div>

      <div class="profile-card">
        {#if error}
          <p class="error-text">{error}</p>
        {/if}

        {#if user}
          <h1>My Profile</h1>
          <p class="subtitle">Manage your account and avatar</p>

          <div class="avatar-wrapper">
            <img
              src={user.avatarUrl
                ? `${BACKEND_URL}${user.avatarUrl}`
                : "/pieces/default-avatar.png"}
              alt=""
            />
          </div>

          <div class="forms">
            <form on:submit|preventDefault={saveProfile}>
              <div style="text-align: center; width: 100%;">
                <strong>Username:</strong>
                {user.username}
              </div>

              <label>
                Email
                <input type="email" bind:value={email} />
              </label>

              <button class="primary-button" type="submit">Save profile</button>
            </form>

            <form
              on:submit|preventDefault={uploadAvatar}
              enctype="multipart/form-data"
            >
              <label>
                Avatar
                <input
                  type="file"
                  accept="image/*"
                  on:change={(e) =>
                    (avatarFile =
                      (e.currentTarget as HTMLInputElement).files?.[0] ?? null)}
                />
              </label>

              <button class="secondary-button" type="submit"
                >Upload avatar</button
              >
            </form>
          </div>
        {:else}
          <p>No user data. Are you logged in?</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page-container {
    min-height: 100vh;
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

  .forms {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 0.9rem;
  }

  input[type="email"],
  input[type="file"] {
    margin-top: 0.25rem;
    padding: 0.6rem 0.7rem;
    width: 100%;
    border-radius: 8px;
    border: none;
    outline: none;
    font-size: 0.95rem;
  }

  .primary-button,
  .secondary-button {
    padding: 0.7rem 1.1rem;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #fff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .primary-button {
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
  }

  .secondary-button {
    background: rgba(0, 0, 0, 0.35);
  }

  .primary-button:hover,
  .secondary-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
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
