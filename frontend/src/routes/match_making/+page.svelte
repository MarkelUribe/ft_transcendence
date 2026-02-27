<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		const playerId = localStorage.getItem('username');
		//const token = localStorage.getItem('token');

		async function startMatchmaking() {

			//const res = await fetch(
			//	`http://localhost:3000/game/player/${playerId}`,
			//	{}
			//);
			//if (res.ok) goto(`/chess/`);;
			
			// Join queue
			await fetch('http://localhost:3000/matchmaking/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId })
			});

			// Start polling
			interval = setInterval(async () => {
				const res = await fetch(
					`http://localhost:3000/matchmaking/status/${playerId}`
				);

				const data = await res.json();

				if (data.status === 'matched') {
					clearInterval(interval);
					goto(`/chess/`);
				}
			}, 2000);
		}

		startMatchmaking();

		return () => clearInterval(interval);
	});
</script>

<style>
	.matchmaking {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		font-family: sans-serif;
	}

	.spinner {
		border: 6px solid #eee;
		border-top: 6px solid #333;
		border-radius: 50%;
		width: 60px;
		height: 60px;
		animation: spin 1s linear infinite;
		margin-top: 20px;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>

<div class="matchmaking">
	<h2>Searching for opponent...</h2>
	<div class="spinner"></div>
</div>