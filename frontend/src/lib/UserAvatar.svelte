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

<style>
  :global(body) {
		margin: 0;
		font-family: 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
		color: #fff;
		overflow: hidden;
	}

  .floating-piece {
		position: absolute;
		font-size: 3rem;
		animation: float 6s ease-in-out infinite;
		opacity: 0.3;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(15deg); }
	}
</style>

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

<span class="floating-piece" style="top: 5%; left: 10%; animation-delay: 0.5s;">♟</span>
<span class="floating-piece" style="top: 15%; left: 70%; animation-delay: 1.2s;">♘</span>
<span class="floating-piece" style="top: 25%; left: 35%; animation-delay: 2.3s;">♖</span>
<span class="floating-piece" style="top: 30%; left: 85%; animation-delay: 0.8s;">♝</span>
<span class="floating-piece" style="top: 45%; left: 15%; animation-delay: 3s;">♞</span>
<span class="floating-piece" style="top: 55%; left: 50%; animation-delay: 1.7s;">♜</span>
<span class="floating-piece" style="top: 65%; left: 75%; animation-delay: 2.8s;">♛</span>
<span class="floating-piece" style="top: 70%; left: 25%; animation-delay: 0.3s;">♚</span>
<span class="floating-piece" style="top: 85%; left: 60%; animation-delay: 4.1s;">♟</span>
<span class="floating-piece" style="top: 90%; left: 5%; animation-delay: 2.6s;">♘</span>
<span class="floating-piece" style="top: 12%; left: 40%; animation-delay: 3.4s;">♝</span>
<span class="floating-piece" style="top: 38%; left: 55%; animation-delay: 1.9s;">♖</span>
<span class="floating-piece" style="top: 48%; left: 90%; animation-delay: 0.6s;">♞</span>
<span class="floating-piece" style="top: 60%; left: 5%; animation-delay: 2.2s;">♜</span>
<span class="floating-piece" style="top: 75%; left: 45%; animation-delay: 3.7s;">♛</span>
<span class="floating-piece" style="top: 95%; left: 80%; animation-delay: 1.1s;">♚</span>