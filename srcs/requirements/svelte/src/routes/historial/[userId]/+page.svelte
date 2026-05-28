<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { io, type Socket } from 'socket.io-client';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { t } from 'svelte-i18n';

interface HistoryPlayer {
	id: number;
	username: string;
	avatarUrl: string | null;
	elo: number;
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

let userId: string;
$: userId = $page.params.userId;

function getWinnerEmoji(game: HistoryGame, playerColor: 'white' | 'black'): string {
	const looserId = Number(game.looser);

	if (game.status === 'active') return '⚔️';
	if (game.status === 'stalemate' || looserId === -1) return '🤝';
	
	if (playerColor === 'white' && looserId === game.black.id) return '👑';
	if (playerColor === 'black' && looserId === game.white.id) return '👑';
	
	return '';
}

function formatDate(raw: string) {
	return new Date(raw).toLocaleDateString('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	});
}

function getPlayerName(games: HistoryGame[], userId: string): string | null {
	if (!games.length) return null;
	const idNum = Number(userId);
	for (const game of games) {
		if (game.white.id === idNum) return game.white.username;
		if (game.black.id === idNum) return game.black.username;
	}
	return null;
}

function getActionLabel(game: HistoryGame): string {
	return game.status === 'active' ? '👀' : '▶';
}

function goToMatch(gameId: string) {
	goto(`/game/${gameId}`);
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
	socket?.emit('getMatchHistory', { userId, limit: 20 });
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
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
}

.history-grid {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	max-width: 600px;
	max-height: 80vh;
	overflow-y: auto;
	margin-top: 1rem;
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.history-grid::-webkit-scrollbar {
	display: none;
}

.game-card {
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 0.5rem;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.action-button {
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 0.5rem;
	padding: 0.5rem 0.75rem;
	cursor: pointer;
	font-weight: 600;
}

.action-button:hover {
	background: #1d4ed8;
}

.matchup {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.player {
	flex: 1;
	text-align: center;
}

.vs {
	font-weight: 600;
	color: rgba(255, 255, 255, 0.6);
	flex-shrink: 0;
}

.match-date {
	font-size: 0.85rem;
	color: rgba(255, 255, 255, 0.6);
	margin-top: 0.5rem;
}

.square {
	width: 0.75rem;
	height: 0.75rem;
	display: inline-block;
	border-radius: 2px;
}

.white-square {
	background: #ffffff;
}

.black-square {
	background: #000000;
}

@media (max-width: 768px) {
	.history-grid {
		max-height: 65vh;
	}
}

</style>

<div class="page">
	<h1>
		{#if !loading && history.length > 0}
			{$t('history.title_user', { values: { name: getPlayerName(history, userId) } })}
		{:else}
			{$t('history.title_generic')}
		{/if}
	</h1>
	{#if loading}
		<p>{$t('history.status.loading')}</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if history.length === 0}
		<p>{$t('history.status.empty')}</p>
	{:else}
		<div class="history-grid">
			{#each history as game}
				<div class="game-card">
					<button class="action-button" on:click={() => goToMatch(game.gameId)}>
						{getActionLabel(game)}
					</button>
					<div class="matchup">
						
							<div class="player">
							<a href="/profile/{game.black.id}" style="color: #FFFFFF;text-decoration: none;">
								<span class="square white-square"></span>
								<span>{game.white.username} ({game.white.elo}) {getWinnerEmoji(game, 'white')}</span>
							</a>
						</div>
						<div class="vs">VS</div>
						<div class="player">
							<a href="/profile/{game.black.id}" style="color: #FFFFFF;text-decoration: none;">
								<span class="square black-square"></span>
								<span>{game.black.username} ({game.black.elo}) {getWinnerEmoji(game, 'black')}</span>
							</a>
						</div>
					</div>
					<div class="match-date">{formatDate(game.createdAt)}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
