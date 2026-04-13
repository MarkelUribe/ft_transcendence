<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  const BACKEND_URL = 'http://localhost:3000';

  type User = {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    elo?: number | null; // add elo if your backend returns it
  };

  let user: User | null = null;
  let loading = true;

  function getToken() {
    if (!browser) return null;
    return localStorage.getItem('token');
  }

  async function loadUser() {
    const token = getToken();
    if (!token) {
      user = null;
      loading = false;
      return;
    }

    loading = true;
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        if (browser) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.dispatchEvent(
            new CustomEvent('auth-changed', {
              detail: { status: 'loggedOut' }
            }),
          );
        }
        user = null;
        loading = false;
        return;
      }

      if (!res.ok) {
        user = null;
        loading = false;
        return;
      }

      user = await res.json();
    } catch (e) {
      user = null;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!browser) return;

    loadUser();

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ status: 'loggedIn' | 'loggedOut' }>;
      if (custom.detail.status === 'loggedOut') {
        user = null;
      } else if (custom.detail.status === 'loggedIn') {
        loadUser();
      }
    };

    window.addEventListener('auth-changed', handler as EventListener);

    return () => {
      window.removeEventListener('auth-changed', handler as EventListener);
    };
  });

  $: currentPath = $page.url.pathname;
  $: hideOnAuthPages = currentPath.startsWith('/login') || currentPath.startsWith('/register') || currentPath.startsWith('/signin');
</script>

{#if !loading && user && !hideOnAuthPages}
  <button
    type="button"
    on:click={() => goto('/profile')}
    style="
      position: fixed;
      top: 1rem;
      left: 1rem;
      border-radius: 9999px;
      padding: 0.4rem 0.7rem 0.4rem 0.4rem;
      border: 2px solid rgba(255, 255, 255, 0.8);
      cursor: pointer;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      z-index: 1000;
      color: #fff;
    "
    aria-label="Go to profile"
  >
    <div
      style="
        width: 64px;
        height: 64px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
      "
    >
      <img
        src={user.avatarUrl ? `${BACKEND_URL}${user.avatarUrl}` : '/pieces/default-avatar.png'}
        alt=""
        style="width: 100%; height: 100%; object-fit: cover; display: block;"
      />
    </div>

    <div
      style="
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-size: 0.8rem;
        line-height: 1.2;
        text-align: left;
      "
    >
      <span style="font-weight: 600;">{user.username}</span>
      <span>ID: {user.id}</span>
      <span>{user.elo ?? 'Unrated'} ELO</span>
    </div>
  </button>
{/if}
