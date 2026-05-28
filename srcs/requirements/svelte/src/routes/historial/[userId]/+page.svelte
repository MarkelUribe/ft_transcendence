<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { io, type Socket } from 'socket.io-client';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

const BASE_URL = import.meta.env.VITE_API_URL;


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

	socket = io(BASE_URL, { auth: { token } });

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
}

.history-grid {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	max-width: 600px;
	max-height: 70vh;
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

.result-row {
	display: flex;
	align-items: center;
	position: relative;
}

.result-msg {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	font-weight: 600;
}

.match-date {
	margin-left: auto;
	font-size: 0.85rem;
	color: rgba(255, 255, 255, 0.6);
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

.game-card {
	border: 3px solid rgba(61, 61, 61, 0.8);
	background: rgba(91, 91, 91, 0.6);
	border-radius: 0.5rem;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	cursor: pointer;
}

.game-card:hover {
	background: rgba(91, 91, 91, 1);
}

.game-card.win {
	border: 3px solid rgba(34, 197, 94, 0.8);
	background: rgba(34, 197, 94, 0.6);
}

.game-card.win:hover {
	background: rgba(34, 197, 94, 1);
}

.game-card.loss {
	border: 3px solid rgba(239, 68, 6, 0.8);
	background: rgba(239, 68, 68, 0.6);
}

.game-card.loss:hover {
	background: rgba(239, 68, 68, 1);
}

@media (max-width: 768px) {
	.history-grid {
		max-height: 65vh;
	}
}

</style>

<div class="page">
	<h1>{#if !loading && history.length > 0}{getPlayerName(history, userId) + "'s "}{/if}Match History</h1>
	{#if loading}
		<p>Loading history…</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if history.length === 0}
		<p>No matches found yet.</p>
	{:else}
		<div class="history-grid">
			{#each history as game}
				{@const myColor = game.white.id === Number(userId) ? 'white' : 'black'}
				{@const me = myColor === 'white' ? game.white : game.black}
				{@const opponentColor = myColor === 'white' ? 'black' : 'white'}
				{@const opponent = opponentColor === 'black' ? game.black : game.white}

				{@const looserId = Number(game.looser)}
				{@const isDraw = game.status !== 'active' && looserId === -1}
				{@const iWon =
					(myColor === 'white' && looserId === game.black.id) ||
					(myColor === 'black' && looserId === game.white.id)}
				{@const iLost =
					!isDraw &&
					game.status !== 'active' &&
					!iWon}

				<div class="game-card" on:click={() => goToMatch(game.gameId)} class:win={iWon} class:loss={iLost}>
					<div class="matchup">
						<div class="player">
							<a href="/profile/{me.id}" style="color: #FFFFFF; text-decoration: none;">
								<span class="square {myColor}-square"></span>
								<span>
									{me.username} ({me.elo})
									{getWinnerEmoji(game, myColor)}
								</span>
							</a>
						</div>

						<div class="vs">VS</div>

						<div class="player">
							<a href="/profile/{opponent.id}" style="color: #FFFFFF; text-decoration: none;">
								<span class="square {opponentColor}-square"></span>
								<span>
									{opponent.username} ({opponent.elo})
									{getWinnerEmoji(game, opponentColor)}
								</span>
							</a>
						</div>
					</div>

					<div class="result-row">
						<div class="result-msg">
							{#if iWon}
								VICTORY
							{:else if iLost}
								DEFEAT
							{:else if isDraw}
								DRAW
							{:else}
								BATTLING
							{/if}
						</div>

						<div class="match-date">
							{formatDate(game.createdAt)}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
