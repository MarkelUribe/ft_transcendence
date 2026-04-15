<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { page } from '$app/stores';
import { io, type Socket } from 'socket.io-client';
import { ChessAPI } from '$lib/api/chess';
import { goto } from '$app/navigation';

let gameId = '';
let board: (string | null)[][] = [];
let selected: string | null = null;
let turn: 'w' | 'b' = 'w';
let myColor: 'w' | 'b' | null = null;
let gameOver = false;
let resultText = '';

let white: string | null = null
let black: string | null = null

let promotion = false;
let promotionSquare: string | null = null;
let pendingPromotionMove: { from: string, to: string } | null = null;

let socket: Socket;
let api: ChessAPI;

$: display = myColor === 'b' ? board.map(r => [...r].reverse()).reverse() : board;

let showConfirm = false;

function confirmSurrender() {
	showConfirm = false;
	surrender();
}

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
	turn = state.fen.split(' ')[1] as 'w' | 'b';

	const id = localStorage.getItem('id');

	white = state.white.username;
	black = state.black.username;
	myColor = null;

	if (id === String(state.white.id))	myColor = 'w';
	if (id === String(state.black.id))	myColor = 'b';
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

function isPawnPromotion(piece: string, targetCoord: string): boolean
{
	if (!piece) return false;

	const isPawn = piece === 'p' || piece === 'P';
	if (!isPawn) return false;

	const targetRow = parseInt(targetCoord[1]); // e.g. "e8" → 8

	if (piece === 'P' && targetRow === 8) return true;
	if (piece === 'p' && targetRow === 1) return true;

	return false;
}

function coordToIndices(coord: string): [number, number]
{
	const file = coord[0];
	const rank = parseInt(coord[1]);

	const col = file.charCodeAt(0) - 'a'.charCodeAt(0);
	const row = 8 - rank;

	return [row, col];
}

function handleSquareClick(r: number, c: number)
{
	const coord = coordFromDisplay(r, c);
	const [or, oc] = originalIndices(r, c);
	const piece = board[or]?.[oc];

	promotion = false;

	if (selected && piece)
	{
		const color = piece < 'a' ? 'w' : 'b';
		if (color === turn && selected === coord)
		{
			selected = null;
			return;
		}
		if (color === turn)
		{
			selected = coord;
			return;
		}
	}

	if (selected) {

		const [sr, sc] = coordToIndices(selected);
		const movingPiece = board[sr]?.[sc];

		if (!movingPiece) return;

		if (isPawnPromotion(movingPiece, coord))
		{
			promotion = true;
			promotionSquare = coord;
			pendingPromotionMove = { from: selected, to: coord };
			return;
		}

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

function handlePromotionChoice(piece: string) {
	if (!selected || !promotionSquare) return;

	socket.emit('proposeMove', {
		gameId,
		from: selected,
		to: promotionSquare,
		promotion: piece.toLowerCase() // e.g., 'q', 'r', 'b', 'n'
	});

	selected = null;
	promotionSquare = null;
	promotion = false;
}

onMount(async () =>
{
	gameId = $page.params.gameId || '';
	api = new ChessAPI(localStorage.getItem('token') || '');

	await fetchGameState();

	socket = io("https://localhost:3000", {
		auth: {
			token: localStorage.getItem("token")
		}
	});

	socket.on('connect', () => {
		socket.emit('joinGame', {
			gameId,
			playerId: localStorage.getItem('id')
		});
	});

	socket.on('gameState', setState);
	socket.on('moveMade', setState);
	socket.on('ended', (msg: any) =>
	{
		const myId = Number(localStorage.getItem('id'));

		if (!myColor)
			resultText = 'Match ended';
		else if (msg.looser === -1)
			resultText = 'Draw';
		else
			resultText = msg.looser === myId ? 'Defeat' : 'Victory';
	
		console.log(msg);

		gameOver = true;
	});
});

function getPromotionPieces(color: 'w' | 'b')
{
	if (color === 'w')
		return ['Q', 'R', 'B', 'N'];
	return ['q', 'r', 'b', 'n'];
}

onDestroy(() => socket?.disconnect());

</script>

<style>

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
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.square.selected::before {
		content: "";
		position: absolute;
		inset: 0;
		background: rgba(62, 58, 24, 0.42);
		z-index: 1;
		pointer-events: none;
	}

	.square.selected {
		box-shadow: inset 0 0 0 0px rgb(0, 255, 42);
	}


	.light {
		background: #f0d9b5; /* beige */
	}

	.dark {
		background: #b58863; /* brown */
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

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(15deg); }
	}

	/* Container that keeps layout consistent */
	.turn-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 90px; /* FIXED total height for turn + promotion */
		gap: 5px; /* space between promotion bar and turn indicator */
	}

	/* Turn indicator styles remain the same */
	.turn-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 15px 40px;
		border-radius: 15px;
		background: #333;
		transition: all 0.3s ease;
		width: 100%;
		justify-content: center;
		min-height: 55px; /* ensures consistent height */
	}

	.turn-indicator .turn-text {
		font-size: 2rem; /* bigger text */
		font-weight: bold; /* optional, makes it stand out */
	}

	/* My-turn effect */
	.turn-indicator.my-turn {
		background: linear-gradient(135deg, #33ff0193, #64dd17);
		color: black;
		font-weight: bold;
		box-shadow: 0 0 12px rgba(0, 255, 100, 0.7);
		animation: pulse 1.2s infinite;
	}

	.turn-indicator.my-turn .dot {
		background: #00ff00;
		box-shadow: 0 0 8px #00ff00;
	}

	/* Promotion bar inherits turn-indicator styles */
	.turn-indicator.promotion-bar {
		padding: 10px 10px;
		background: linear-gradient(135deg, #33ff0193, #64dd17);
		justify-content: center;
		gap: 10px; /* spacing for pieces */
	}

	/* Buttons inside promotion */
	.turn-indicator.promotion-bar button {
		background: none;
		border: 2px solid transparent;
		border-radius: 10px;
		cursor: pointer;
		padding: 5px;
		transition: all 0.2s ease;
	}

	.turn-indicator.promotion-bar button:hover {
		border-color: white;
		background: rgba(255, 255, 255, 0.1);
	}

	.turn-indicator.promotion-bar img {
		width: 50px;
		height: 50px;
		object-fit: contain;
	}
	/* Animation */
	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	.surrender-btn {
		background: linear-gradient(135deg, #ff4d4d, #b30000);
		color: white;
		border: none;
		padding: 10px 18px;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 10px rgba(0,0,0,0.3);
	}

	.surrender-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 14px rgba(0,0,0,0.4);
	}

	.surrender-btn:active {
		transform: scale(0.96);
	}

	/* OVERLAY */
	.confirm-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	/* MODAL */
	.confirm-box {
		background: #1e1e1e;
		color: white;
		padding: 24px;
		border-radius: 12px;
		text-align: center;
		box-shadow: 0 10px 30px rgba(0,0,0,0.5);
		animation: pop 0.2s ease;
	}

	.confirm-box h2 {
		margin-bottom: 10px;
	}

	.confirm-box p {
		color: #ccc;
		margin-bottom: 20px;
	}

	/* ACTION BUTTONS */
	.actions {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	.cancel {
		background: #444;
		color: white;
		border: none;
		padding: 8px 14px;
		border-radius: 6px;
		cursor: pointer;
	}

	.confirm {
		background: #ff4d4d;
		color: white;
		border: none;
		padding: 8px 14px;
		border-radius: 6px;
		font-weight: bold;
		cursor: pointer;
	}

	/* POP ANIMATION */
	@keyframes pop {
		from {
			transform: scale(0.8);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

</style>

<div class="game-container">

	<div class="turn-container">
		{#if promotion && myColor}
			<div class="turn-indicator promotion-bar {myColor === turn ? 'my-turn' : ''}">
				{#each getPromotionPieces(myColor) as p}
					<button on:click={() => handlePromotionChoice(p)}>
						<img src={getPieceImage(p)} />
					</button>
				{/each}
			</div>
		{:else}
			<div class="turn-indicator {myColor === turn ? 'my-turn' : ''}">
				<span class="dot"></span>
				<span class="turn-text">
					{turn === myColor ? 'Your Turn!' : turn === 'w'? white + "'s turn" : black + "'s turn"}
				</span>
			</div>
		{/if}
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
		{#if myColor !== null}
		<button class="surrender-btn" on:click={() => showConfirm = true}>
			🏳️ Surrender
		</button>
		{:else}
		<button class="surrender-btn" on:click={goHome}> Return to home </button>
		{/if}
	</div>

	{#if showConfirm}
		<div class="confirm-overlay">
			<div class="confirm-box">
				<h2>Are you sure?</h2>
				<p>You will lose the game.</p>

				<div class="actions">
					<button class="cancel" on:click={() => showConfirm = false}>
						Cancel
					</button>
					<button class="confirm" on:click={confirmSurrender}>
						Yes, surrender
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
