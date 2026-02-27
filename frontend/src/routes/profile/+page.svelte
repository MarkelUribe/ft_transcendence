<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  const BACKEND_URL = 'http://localhost:3000';

  let user: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null = null;

  let email = '';
  let avatarFile: File | null = null;
  let loading = true;
  let error: string | null = null;

  function getToken() {
    if (!browser) return null;
    return localStorage.getItem('token');
  }

  onMount(async () => {
    const token = getToken();
    if (!token) {
      goto('/login');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (res.status === 401) {
        goto('/login');
        return;
      }

      if (!res.ok) {
        error = 'Failed to load profile';
        return;
      }

      const data = await res.json();
      user = data;
      email = user ? user.email : '';
    } catch (e) {
      error = 'Network error while loading profile';
    } finally {
      loading = false;
    }
  });

  async function saveProfile() {
    if (!user) return;
    error = null;

    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      error = 'Failed to update profile';
      return;
    }

    user = await res.json();
  }

  async function uploadAvatar() {
    if (!avatarFile) return;
    error = null;

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const res = await fetch(`${BACKEND_URL}/users/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`
      },
      body: formData
    });

    if (!res.ok) {
      error = 'Failed to upload avatar';
      return;
    }

    user = await res.json();
  }
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: #fff;
  }

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

  .back-button {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
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
    transition: transform 0.2s ease, box-shadow 0.2s ease;
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
</style>

<div class="page-container">
  {#if loading}
    <div class="profile-card">
      <p>Loading profile...</p>
    </div>
  {:else}
    <div class="profile-card">
      <button
        class="back-button"
        type="button"
        on:click={() => {
          if (browser && window.history.length > 1) {
            window.history.back();
          } else {
            goto('/');
          }
        }}
      >
        ⬅ Back
      </button>

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
              : '/pieces/default-avatar.png'}
            alt=""
          />
        </div>

        <div class="forms">
          <form on:submit|preventDefault={saveProfile}>
            <div style="text-align: center; width: 100%;">
              <strong>Username:</strong> {user.username}
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
                  (avatarFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null)}
              />
            </label>

            <button class="secondary-button" type="submit">Upload avatar</button>
          </form>
        </div>
      {:else}
        <p>No user data. Are you logged in?</p>
      {/if}
    </div>
  {/if}
</div>