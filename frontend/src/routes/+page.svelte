<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
	import { io, type Socket } from 'socket.io-client';

	let username = '';
	let isLoggedIn = false;	
	let socket: Socket | null = null;
	let status = 'Not searching';
	let searching = false;
	let playerId: string | null = null;

  onMount(() => {
    if (!browser) return;

    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    playerId = localStorage.getItem('id');

    if (token && storedUsername) {
      isLoggedIn = true;
      username = storedUsername;
    }
  });

async function startMatchmaking() {
	if (!playerId) {
		status = 'No player ID found';
		return;
	}

	searching = true;
	status = 'Checking for existing game...';

	try {
		const res = await fetch(`http://localhost:3000/game/player/${playerId}`);

		if (res.ok) {
			const game = await res.json();

			if (game && game.gameId) {
				goto(`/game/${game.gameId}`);
				return;
			}
		}
	} catch (err) {
		console.error(err);
	}

	// No active game → start matchmaking
	status = 'Connecting...';

	const newSocket = io('http://localhost:3000');
	socket = newSocket;

	newSocket.on('connect', () => {
		status = 'Searching for opponent...';
		newSocket.emit('joinQueue', { playerId });
	});

	newSocket.on('waiting', () => {
		status = 'Waiting for opponent...';
	});

	newSocket.on('matched', (data: { gameId: string }) => {
		searching = false;
		goto(`/game/${data.gameId}`);
	});

	newSocket.on('disconnect', () => {
		status = 'Disconnected...';
		searching = false;
	});
}

  function cancelMatchmaking() {
		if (!socket) return;
		socket.emit('leaveQueue');
		socket.disconnect();
		socket = null;
		status = 'Matchmaking canceled';
		searching = false;
	}

	function handleButtonClick() {
		if (searching) cancelMatchmaking();
		else startMatchmaking();
	}

  function handleLogin() {
    goto('/login');
  }

  function handleLogout() {
    if (!browser) return;

    localStorage.removeItem('token'); 
    localStorage.removeItem('id');
    localStorage.removeItem('username');
    isLoggedIn = false;
    username = '';

    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { status: 'loggedOut' } }));
  }
</script>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
		color: #fff;
		overflow: hidden;
	}

	.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		text-align: center;
		position: relative;
		z-index: 1;
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
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		color: white;
	}

	.button:hover {
		transform: translateY(-3px) scale(1.05);
		box-shadow: 0 6px 20px rgba(0,0,0,0.4);
	}

	.button.searching {
		background: linear-gradient(90deg, #ff512f, #dd2476);
		animation: pulse 1.2s infinite;
	}

	.button.idle {
		background: linear-gradient(90deg, #24c6dc, #514a9d);
	}

	@keyframes pulse {
		0% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
		50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.8); }
		100% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
	}

	.status {
		font-weight: bold;
		font-family: monospace;
		font-size: 1rem;
		margin-top: 1rem;
		text-align: center;
	}

	/* Floating chess pieces */
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
			<button
				class="button {searching ? 'searching' : 'idle'}"
				on:click={handleButtonClick}>
				{searching ? 'Searching... (Click to cancel)' : 'Play'}
			</button>
			<button class="button idle" on:click={handleLogout}>Logout</button>
			{#if searching}
				<p class="status">{status}</p>
			{/if}
		{:else}
			<button class="button idle" on:click={handleLogin}>Login</button>
		{/if}
	</div>
</div>

<!-- Floating chess pieces -->
<span class="floating-piece" style="top: 10%; left: 20%;">♞</span>
<span class="floating-piece" style="top: 40%; left: 80%; animation-delay: 2s;">♜</span>
<span class="floating-piece" style="top: 70%; left: 30%; animation-delay: 4s;">♚</span>
<span class="floating-piece" style="top: 20%; left: 60%; animation-delay: 1s;">♛</span>