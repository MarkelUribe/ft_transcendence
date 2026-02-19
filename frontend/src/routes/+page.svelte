<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  let username = '';
  let isLoggedIn = false;

  onMount(() => {
    if (!browser) return;

    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
      isLoggedIn = true;
      username = storedUsername;
    }
  });

  function handlePlay() {
    goto('/chess');
  }

  function handleLogin() {
    goto('/login');
  }

  function handleLogout() {
    if (!browser) return;

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    isLoggedIn = false;
    username = '';
  }
</script>

<style>
  /* Full-page gradient background */
  :global(body) {
    margin: 0;
    font-family: 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: #fff;
  }

  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
  }

  h1 {
    font-size: 4rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    max-width: 600px;
  }

  .buttons {
    display: flex;
    gap: 2rem;
  }

  .button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-decoration: none;
    color: #fff;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }

  .button:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  }

  /* Floating chess pieces for fun */
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

<div class="container">
  <h1>Welcome to Chess Arena</h1>
  <p>
    {#if isLoggedIn}
      Hello, {username}! Ready to play?
    {:else}
      Play chess, review your game logs, and improve your strategy. Choose what you want to do below:
    {/if}
  </p>
  <div class="buttons">
    {#if isLoggedIn}
      <button class="button" on:click={handlePlay}>Play</button>
      <button class="button" on:click={handleLogout}>Logout</button>
    {:else}
      <button class="button" on:click={handleLogin}>Login</button>
    {/if}
  </div>
</div>

<!-- Fun floating chess pieces -->
<span class="floating-piece" style="top: 10%; left: 20%;">♞</span>
<span class="floating-piece" style="top: 40%; left: 80%; animation-delay: 2s;">♜</span>
<span class="floating-piece" style="top: 70%; left: 30%; animation-delay: 4s;">♚</span>
<span class="floating-piece" style="top: 20%; left: 60%; animation-delay: 1s;">♛</span>
