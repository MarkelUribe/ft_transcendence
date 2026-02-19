<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let username = "";
  let password = "";
  let isLoggedIn = false;
  let error: string | null = null;

  onMount(() => {
    if (!browser) return;

    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
      isLoggedIn = true;
      username = storedUsername;
    }
  });

  async function handleLogin() {
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const message = await res.json();
        console.error('Login failed', res.status, message);
        error = message.message || 'Log in failed';
        return;
      }

      const data = await res.json();
      const token = data.access_token;

      if (!token) {
        console.error('Login response missing access_token');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('username', data.username);
      isLoggedIn = true;
      username = data.username;

      goto('/chess');
    } catch (err) {
      console.error('Login error', err);
      error = 'Unexpected error during Log in';
    }
  }

  function handleLogout() {
    if (!browser) return;

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    isLoggedIn = false;
    username = "";
    password = "";
  }
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: #fff;
  }

  .login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
  }

  .login-box {
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 16px;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 300px;
  }

  input {
    padding: 0.8rem;
    border-radius: 8px;
    border: none;
    outline: none;
    font-size: 1rem;
  }

  button {
    padding: 0.8rem;
    border-radius: 12px;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
    color: #fff;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  }

  button:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  }

  .floating-piece {
    position: absolute;
    font-size: 2.5rem;
    animation: float 6s ease-in-out infinite;
    opacity: 0.3;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(15deg); }
  }
</style>

<div class="login-container">
  <h1>Chess Arena Login</h1>

  <div class="login-box">
    <button on:click={() => goto('/')} style="align-self: flex-start; font-size: 0.9rem; padding: 0.4rem 0.8rem; margin-bottom: 0.5rem;">⬅ Back to home</button>

    {#if isLoggedIn}
      <p>Hello, {username}</p>
      <button on:click={handleLogout}>Logout</button>
    {:else}
     {#if error}
      <p style="color: #ffb3b3; margin: 0 0 0.5rem 0;">{error}</p>
    {/if}
      <input type="text" placeholder="Username" bind:value={username} />
      <input type="password" placeholder="Password" bind:value={password} />
      <button on:click={handleLogin}>Login</button>
      <a href="/register"><button>Register Now</button></a>
    {/if}

  </div>
</div>

<!-- Floating chess pieces for style -->
<span class="floating-piece" style="top: 15%; left: 10%;">♞</span>
<span class="floating-piece" style="top: 60%; left: 75%; animation-delay: 2s;">♜</span>
<span class="floating-piece" style="top: 25%; left: 60%; animation-delay: 4s;">♚</span>
