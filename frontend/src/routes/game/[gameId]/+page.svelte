<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { page } from '$app/stores';
import { io, type Socket } from 'socket.io-client';
import { ChessAPI } from '$lib/api/chess';
import { goto } from '$app/navigation';

let gameId = '';
let board: (string | null)[][] = [];
let selected: string | null = null;
let status = '';
let turn: 'w' | 'b' = 'w';
let myColor: 'w' | 'b' | null = null;
let gameOver = false;
let resultText = '';

let socket: Socket;
let api: ChessAPI;

$: display =
	myColor === 'b'
		? board.map(r => [...r].reverse()).reverse()
		: board;

function parseFen(fen: string)
{
	return fen.split(' ')[0].split('/').map(row => {
		const result: (string | null)[] = [];

		for (const ch of row) {
			if (/\d/.test(ch))
				result.push(...Array(Number(ch)).fill(null));
			else
				result.push(ch);
		}

		return result;
	});
}

function setState(state: any)
{
	board = parseFen(state.fen);
	status = state.status;
	turn = state.fen.split(' ')[1] as 'w' | 'b';

	const me = localStorage.getItem('id');

	if (me === String(state.white.id)) myColor = 'w';
	else if (me === String(state.black.id)) myColor = 'b';
	else myColor = null;
}

function originalIndices(r: number, c: number)	{ return myColor === 'b' ? [7 - r, 7 - c] : [r, c]; }
function getPieceImage(piece: string | null)	{ return piece ? `/pieces/${piece}.png` : ''; }
function surrender()							{ socket?.emit('surrender', { gameId }); }
function goHome()								{ window.location.href = '/'; }

function coordFromDisplay(r: number, c: number)
{
	const [or, oc] = originalIndices(r, c);
	return `${String.fromCharCode(97 + oc)}${8 - or}`;
}

async function fetchGameState()
{
	try
	{
		const g: any = await api.getGame(gameId);
		setState(g);
	}
	catch (e)
	{
		console.error('could not fetch game', e);
		goto('/');
	}
}

function handleSquareClick(r: number, c: number)
{
	const coord = coordFromDisplay(r, c);
	const [or, oc] = originalIndices(r, c);
	const piece = board[or]?.[oc];

	if (selected === coord) {
		selected = null;
		return;
	}

	if (selected) {
		socket.emit('proposeMove', { gameId, from: selected, to: coord });
		selected = null;
		return;
	}

	if (piece) {
		const color = piece < 'a' ? 'w' : 'b';
		if (myColor !== turn) return;
		if (color === turn) selected = coord;
	}
}

onMount(async () =>
{
	gameId = $page.params.gameId || '';
	api = new ChessAPI(localStorage.getItem('token') || '');

	await fetchGameState();

	socket = io('http://localhost:3000');

	socket.on('connect', () => {
		socket.emit('joinGame', {
			gameId,
			playerId: localStorage.getItem('id')
		});
	});

	socket.on('gameState', setState);
	socket.on('moveMade', setState);
	socket.on('gameEnded', (msg: any) =>
	{
		status = msg.status;

		if (msg.status === 'draw')					resultText = 'Draw';
		else if (msg.status === 'checkmate') {		resultText = turn === myColor ? 'Defeat' : 'Victory'; }
		else if (msg.status === 'surrendered') {	resultText = 'Defeat by surrender'; }

		gameOver = true;
	});
});

onDestroy(() => socket?.disconnect());
</script>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
		color: #fff;
		overflow: hidden;
	}

	.game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(8, 70px);
		grid-template-rows: repeat(8, 70px);
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		margin: 1rem auto;
	}

	.square {
		width: 70px;
		height: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.light {
		background: #f0d9b5; /* beige */
	}

	.dark {
		background: #b58863; /* brown */
	}

	.selected {
		border: 3px solid rgb(247, 255, 87);
	}

	.status-bar {
		text-align: center;
		margin-bottom: 0.8rem;
		font-weight: bold;
	}

	.controls {
		text-align: center;
		margin-top: 1rem;
	}

	img.piece {
		width: 100%;
		height: 100%;
		user-select: none;
		pointer-events: none;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.6);

		display: flex;
		align-items: center;
		justify-content: center;

		z-index: 1000;
	}

	.modal-box {
		background: rgb(252, 252, 252);
		padding: 30px 40px;
		border-radius: 12px;
		text-align: center;
		box-shadow: 0 10px 30px rgba(0,0,0,0.4);
	}

	.modal-box h2 {
		margin-bottom: 20px;
		color: black;
	}

	.modal-box button {
		padding: 10px 20px;
		font-size: 16px;
		cursor: pointer;
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

<div class="game-container">
	<div class="status-bar">
		<div>Game: {gameId}</div>
		<div>Your colour: {myColor === 'w' ? 'White' : myColor === 'b' ? 'Black' : '…'}</div>
		<div>Turn: {turn === 'w' ? 'White' : 'Black'}</div>
		<div>Status: {status}</div>
	</div>

<div class="board">
	{#each display as row, r}
		{#each row as cell, c}
			<button
				type="button"
				class="square {( (r + c) % 2 === 0 ? 'light' : 'dark' )}"
				class:selected={selected === coordFromDisplay(r, c)}
				on:click={() => handleSquareClick(r, c)}
			>
				{#if cell}
					<img class="piece" src={getPieceImage(cell)} alt={cell} />
				{/if}
			</button>
		{/each}
	{/each}
	{#if gameOver}
	<div class="modal">
		<div class="modal-box">
		<h2>{resultText}</h2>
		<button on:click={goHome}>Return to home</button>
		</div>
	</div>
	{/if}
</div>

<div class="controls">
	<button on:click={surrender}>Surrender</button>
</div>
</div>

<span class="floating-piece" style="top: 10%; left: 20%;">♞</span>
<span class="floating-piece" style="top: 40%; left: 80%; animation-delay: 2s;">♜</span>
<span class="floating-piece" style="top: 80%; left: 30%; animation-delay: 4s;">♚</span>
<span class="floating-piece" style="top: 20%; left: 60%; animation-delay: 1s;">♛</span>