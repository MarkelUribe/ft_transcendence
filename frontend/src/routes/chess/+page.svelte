<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { io, type Socket } from 'socket.io-client';

	let socket: Socket | null = null;
	let status = 'Not searching';
	let searching = false;
	let playerId: string | null = null;

	onMount(() => {
		// Safe to access localStorage here
		playerId = localStorage.getItem('username');
	});

	function startMatchmaking() {
		if (!playerId) {
			status = 'No player ID found';
			return;
		}

		searching = true;
		status = 'Connecting...';

		socket = io('http://localhost:3000'); // Nest backend

		socket.on('connect', () => {
			status = 'Searching for opponent...';
			socket!.emit('joinQueue', { playerId });
		});

		socket.on('waiting', () => {
			status = 'Waiting for opponent...';
		});

		socket.on('matched', (data: { gameId: string }) => {
			searching = false;
			goto(`/chess/${data.gameId}`);
		});

		socket.on('disconnect', () => {
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
</script>

<style>
	.matchmaking-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		gap: 1.5rem;
		background: #1e1e2f;
		color: white;
		font-family: 'Helvetica', sans-serif;
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
		text-align: center;
	}
</style>

<div class="matchmaking-container">
	<button class="button {searching ? 'searching' : 'idle'}" on:click={handleButtonClick}>
		{searching ? 'Searching... (Click to cancel)' : 'Find Match'}
	</button>
	<p class="status">{status}</p>
</div>