<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { io, type Socket } from 'socket.io-client';

interface HistoryPlayer {
	id: number;
	username: string;
	avatarUrl: string | null;
}

interface HistoryGame {
	gameId: string;
	white: HistoryPlayer;
	black: HistoryPlayer;
	status: string;
	looser: number;
	createdAt: string;
	updatedAt: string;
}

let socket: Socket | null = null;
let history: HistoryGame[] = [];
let loading = true;
let error: string | null = null;

function getResult(game: HistoryGame): string {
	if (game.status === 'stalemate') return 'Draw';
	if (game.looser === -1) return 'Unknown';

	const meId = Number(localStorage.getItem('id'));
	if (game.looser === meId) return 'Loss';
	return 'Win';
}

function getOpponent(game: HistoryGame): HistoryPlayer {
	const meId = Number(localStorage.getItem('id'));
	return game.white.id === meId ? game.black : game.white;
}

function formatDate(raw: string) {
	return new Date(raw).toLocaleString();
}

onMount(() => {
	const token = localStorage.getItem('token');
	if (!token) {
		error = 'You must be logged in to view match history.';
		loading = false;
		return;
	}

	socket = io('https://localhost:3000', { auth: { token } });

	socket.on('connect', () => {
		socket?.emit('getMatchHistory', { limit: 20 });
	});

	socket.on('matchHistory', (data: { games: HistoryGame[] }) => {
		history = data.games;
		loading = false;
	});

	socket.on('error', (payload: { message: string }) => {
		error = payload?.message ?? 'Unable to load match history.';
		loading = false;
	});

	socket.on('connect_error', (err: Error) => {
		error = err.message;
		loading = false;
	});
});

onDestroy(() => {
	socket?.disconnect();
	socket = null;
});
</script>

<style>
.page {
	padding: 1.5rem;
}

.history-table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 1rem;
}

.history-table th,
.history-table td {
	padding: 0.75rem 1rem;
	border: 1px solid rgba(255, 255, 255, 0.08);
	text-align: left;
}

.history-table th {
	background: rgba(255,255,255,0.05);
}

.status-chip {
	padding: 0.25rem 0.5rem;
	border-radius: 999px;
	font-size: 0.85rem;
}

.status-checkmate {
	background: rgba(16, 185, 129, 0.15);
	color: #10b981;
}

.status-stalemate {
	background: rgba(59, 130, 246, 0.15);
	color: #3b82f6;
}

.status-ended {
	background: rgba(107, 114, 128, 0.15);
	color: #6b7280;
}
</style>

<div class="page">
	<h1>Match History</h1>
	<p>Recent matches are shown below, with result, opponent, and final status.</p>

	{#if loading}
		<p>Loading history…</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if history.length === 0}
		<p>No matches found yet.</p>
	{:else}
		<table class="history-table">
			<thead>
				<tr>
					<th>Result</th>
					<th>Opponent</th>
					<th>Status</th>
					<th>Created At</th>
					<th>Updated At</th>
				</tr>
			</thead>
			<tbody>
				{#each history as game}
					<tr>
						<td>{getResult(game)}</td>
						<td>{getOpponent(game).username}</td>
						<td>
							<span class="status-chip {game.status === 'checkmate' ? 'status-checkmate' : game.status === 'stalemate' ? 'status-stalemate' : 'status-ended'}">
								{game.status}
							</span>
						</td>
						<td>{formatDate(game.createdAt)}</td>
						<td>{formatDate(game.updatedAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
