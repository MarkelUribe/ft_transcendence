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

let whiteTime;
let blackTime;

let logs: any[] = [];
let currentMoveIndex = 0;
let moveFrom: string | null = null;
let moveTo: string | null = null;

let white: string | null = null
let black: string | null = null

let promotion = false;
let promotionSquare: string | null = null;
let pendingPromotionMove: { from: string, to: string } | null = null;

let socket: Socket;
let api: ChessAPI;

$: display = myColor === 'b' ? board.map(r => [...r].reverse()).reverse() : board;
$: isReviewMode = currentMoveIndex !== logs.length - 1;
$: uiMode = isReviewMode ? 'review' : 'live';


let showConfirm = false;

function confirmSurrender()
{
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
	logs = state.moves || [];

	const lastMove = logs.length > 0 ? logs[logs.length - 1] : null;

	board = parseFen(lastMove ? lastMove.fen : null);

	turn = lastMove ? lastMove.fen.split(' ')[1] as 'w' | 'b' : 'w';

	const id = localStorage.getItem('id');

	whiteTime = lastMove.whiteTimeMs;
	blackTime = lastMove.blackTimeMs;

	currentMoveIndex = logs.length - 1;

	white = state.white.username;
	black = state.black.username;
		
	myColor = null;

	if (state.status === 'ended')
		return;

	if (id === String(state.white.id)) myColor = 'w';
	if (id === String(state.black.id)) myColor = 'b';
}

function goToMove(index: number)
{
	if (index < 0 || index >= logs.length) return;

	currentMoveIndex = index;

	const move = logs[index];

	board = parseFen(move.fen);
	turn = move.fen.split(' ')[1] as 'w' | 'b';

	selected = null;
	moveFrom = move.from ?? null;
	moveTo = move.to ?? null;
	whiteTime = move.whiteTimeMs;
	blackTime = move.blackTimeMs;
}

function updateState(msg: any)
{
	logs = [...logs, msg.move]; // append move

	currentMoveIndex = logs.length - 1;
	board = parseFen(msg.move.fen);
	turn = msg.move.fen.split(' ')[1] as 'w' | 'b';

	moveFrom = msg.move.from ?? null;
	moveTo = msg.move.to ?? null;

	whiteTime = msg.move.whiteTimeMs;
	blackTime = msg.move.blackTimeMs;
}

function handleEnd(msg: any)
{
	const myId = Number(localStorage.getItem('id'));

	if (!myColor)
		resultText = 'Match ended';
	else if (msg.looser === -1)
		resultText = 'Draw';
	else
		resultText = msg.looser === myId ? 'Defeat' : 'Victory';

	gameOver = true;
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
	window.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowLeft') prevMove();
		if (e.key === 'ArrowRight') nextMove();
	});

	gameId = $page.params.gameId || '';

//	api = new ChessAPI(localStorage.getItem('token') || '');
//
//	await fetchGameState();

	socket = io("https://localhost:3000", { auth: { token: localStorage.getItem("token") } });

	socket.on('connect', () => { socket.emit('joinGame', { gameId, playerId: localStorage.getItem('id') }); });

	socket.on('gameState', setState);

	socket.on('moveMade', updateState);

	socket.on('ended', handleEnd);
});

function getPromotionPieces(color: 'w' | 'b')
{
	if (color === 'w')
		return ['Q', 'R', 'B', 'N'];
	return ['q', 'r', 'b', 'n'];
}

function groupMoves(logs: any[])
{
	const result = [];

	for (let i = 0; i < logs.length; i += 2)
	{
		result.push({
			number: Math.floor(i / 2) + 1,

			white: logs[i],
			whiteFen: logs[i]?.fen,

			black: logs[i + 1],
			blackFen: logs[i + 1]?.fen,
		});
	}

	return result;
}

function prevMove()		{ goToMove(currentMoveIndex - 1); selected = null; }
function nextMove()		{ goToMove(currentMoveIndex + 1); selected = null; }
function goToStart()	{ goToMove(0); }
function goToEnd()		{ goToMove(logs.length - 1); }

function getTurnText(turn: 'w' | 'b', myColor: 'w' | 'b' | null, white: string, black: string, uiMode: 'live' | 'review')
{
	if (!white || !black) return '';

	if (uiMode === 'review')
	{
		if (currentMoveIndex == 0)
			return "Start of the Match";
		const moveNumber = Math.ceil(currentMoveIndex / 2);
		const color = currentMoveIndex % 2 === 0 ? 'B' : 'W';
		return `Move ${moveNumber} ${color}`;
	}

	if (turn === myColor) return 'Your Turn!';
	if (turn === 'w') return `${white}'s turn`;
	return `${black}'s turn`;
}

function formatTime(ms: number)
{
	const totalSeconds =
		Math.ceil(ms / 1000);

	const minutes =
		Math.floor(totalSeconds / 60);

	const seconds =
		totalSeconds % 60;

	return `${minutes}:${seconds
		.toString()
		.padStart(2, '0')}`;
}

onDestroy(() => socket?.disconnect());
</script>

<div class="page">
	<div class="game-container">
		<div class="clock">
			White:
			{formatTime(whiteTime)}
		</div>

		<div class="clock">
			Black:
			{formatTime(blackTime)}
		</div>
				<div class="top-bar">
					<div class="turn-container">
						{#if promotion && myColor}
							<div class="turn-indicator promotion-bar {myColor === turn ? 'my-turn' : ''}">
								{#each getPromotionPieces(myColor) as p}
									<button type="button" on:click={() => handlePromotionChoice(p)}>
										<img src={getPieceImage(p)} alt={p} />
									</button>
								{/each}
							</div>
						{:else}
							<div class="turn-indicator {myColor === turn ? 'my-turn' : ''}" class:review={uiMode === 'review'}>
								<span class="dot"></span>
								<span class="turn-text">{getTurnText(turn, myColor, white, black, uiMode)}</span>
							</div>
						{/if}
					</div>
				</div>

			<div class="game-layout">
				<div class="board-area">
					<div class="chess-board">
						{#each display as row, r}
							{#each row as cell, c}
								<button
									type="button"
									class="square {(r + c) % 2 === 0 ? 'light' : 'dark'}"
									class:selected={selected === coordFromDisplay(r, c)}
									class:move-highlight={
										coordFromDisplay(r, c) === moveFrom ||
										coordFromDisplay(r, c) === moveTo
									}
									on:click={() => handleSquareClick(r, c)}
								>

									{#if cell}
										<img
											class="piece"
											src={getPieceImage(cell)}
											alt={cell}
										/>
									{/if}

									{#if r === 7}
										<span class="coord file">
											{myColor === 'b'
												? String.fromCharCode(104 - c)
												: String.fromCharCode(97 + c)}
										</span>
									{/if}

									{#if c === 0}
										<span class="coord rank">
											{myColor === 'b' ? r + 1 : 8 - r}
										</span>
									{/if}

								</button>
							{/each}
						{/each}
					</div>
				</div>
				<div class="side-area">
					<div class="logs-panel card shadow-sm h-100">

						<div class="card-body p-0 logs-list">

							{#each groupMoves(logs.slice(1)) as move, i}
								<div class="log-row d-flex align-items-center px-3 py-2">

									<span class="move-number text-muted">
										{move.number}.
									</span>

									<button
										class="move-btn white-move"
										class:active-move={currentMoveIndex === i * 2 + 1}
										on:click={() => goToMove(i * 2 + 1)}
									>
										{move.white?.san}
									</button>

									<button
										class="move-btn black-move"
										class:active-move={currentMoveIndex === i * 2 + 2}
										on:click={() => goToMove(i * 2 + 2)}
									>
										{move.black?.san}
									</button>

								</div>
							{/each}

						</div>
					</div>
				</div>
			</div>

			<div class="bottom-bar">
				<div class="bottom-spacer">
					<div class="controls">
						{#if myColor !== null && !gameOver}
							<button class="surrender-btn" on:click={() => showConfirm = true}>
								🏳️ Surrender
							</button>
						{:else}
							<button class="surrender-btn" on:click={goHome}>
								Return to home
							</button>
						{/if}
					</div>
				</div>

				<div class="move-controls-panel">
					<button class="nav-btn" on:click={goToStart} disabled={currentMoveIndex <= 0}>◀◀</button>
					<button class="nav-btn" on:click={prevMove} disabled={currentMoveIndex <= 0}>◀</button>
					<button class="nav-btn" on:click={nextMove} disabled={currentMoveIndex >= logs.length - 1}>▶</button>
					<button class="nav-btn" on:click={goToEnd} disabled={currentMoveIndex >= logs.length - 1}>▶▶</button>
				</div>
			</div>

			{#if showConfirm}
			<div class="modal">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<h5>Confirm Surrender</h5>
						</div>
						<div class="modal-body">
							Are you sure? You will lose the game.
						</div>
						<div class="modal-footer">
							<button class="btn-secondary" on:click={() => showConfirm = false}>
								Cancel
							</button>
							<button class="btn-danger" on:click={confirmSurrender}>
								Yes, surrender
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-backdrop"></div>
			{/if}

			{#if gameOver}
			<div class="modal">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<h5>Game Over</h5>
						</div>
						<div class="modal-body">
							{resultText}
						</div>
						<div class="modal-footer">
							<button class="btn-secondary" on:click={goHome}>
								Return to home
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-backdrop"></div>
			{/if}
	</div>
</div>

<style>

.page {
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 1rem;
	box-sizing: border-box;
}

.game-container {
	width: min(1300px, 100%);
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.game-layout {
	display: flex;
	flex-wrap: wrap;
	align-items: stretch;
	justify-content: center;
	gap: 10px;

	width: 100%;
}

.board-area {
	flex: 0 1 min(80vw, 80vh);
	aspect-ratio: 1 / 1;

	width: 100%;
	max-width: 800px;
	min-width: 250px;
}

.side-area {
	flex: 1 1 300px;

	display: flex;
	flex-direction: column;

	min-width: 250px;
	min-height: 250px;
}

.logs-panel {
	background: #2b2f33;
	border-radius: 10px;
	box-shadow: 0 8px 25px rgba(0,0,0,0.2);
	border: 1px solid rgba(255,255,255,0.05);

	display: flex;
	flex-direction: column;

	height: 100%;
	max-height: 80vh;
	overflow: hidden;
}

.logs-list {
	flex: 1;
	overflow-y: auto;
}

.logs-list::-webkit-scrollbar {
	width: 0.625rem;
}

.logs-list::-webkit-scrollbar-thumb {
	background: rgb(113 113 113);
	border-radius: 0.2rem;
}

.log-row {
	display: grid;

	/* better scaling columns */
	grid-template-columns:
		minmax(5rem, auto)
		minmax(0, 1fr)
		minmax(0, 1fr);

	align-items: start;

	gap: 0.75rem;

	padding: 0.75rem 1rem;

	font-size: 1rem;
	line-height: 1.5;

	border-bottom: 1px solid rgba(255,255,255,0.04);
	transition: background 0.15s ease;

	/* IMPORTANT */
	min-width: 0;
	height: auto;
}

.log-row > * {
	min-width: 0;

	/* allows wrapping */
	white-space: normal;
	overflow-wrap: anywhere;
	word-break: break-word;
}

.log-row:hover {
	background: rgba(255,255,255,0.05);
}
.move-number {
	color: #888;
	font-size: clamp(1rem, 1.5vw, 10rem);
	min-width: 30px;
}

.active-move {
	background: #4dabf7;
	color: #fff !important;
	box-shadow: 0 0 0 1px rgb(193, 193, 193);
}

.move-btn {
	border: none;
	background: transparent;

	text-align: left;
	border-radius: 6px;

	transition: all 0.15s ease;

	font-size: inherit;
	padding: clamp(2px, 0.4vw, 6px);
}

.white-move {
	color: #ffffff;
	font-weight: 600;
}

.black-move {
	color: #c9c9c9;
}

.top-bar {
	background: #ccc;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 clamp(40px, 6vh, 80px);
	width: 100%;
}

.turn-container {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
}

.turn-indicator {
	display: inline-flex;
	align-items: center;
	gap: clamp(10px, 1vw, 16px);
	padding: clamp(10px, 1vw, 16px) clamp(14px, 2vw, 20px);
	border-radius: 999px;
	background: rgba(0, 0, 0, 0.1);
	color: #1f2937;
	font-weight: 700;
	font-size: clamp(0.95rem, 1vw, 1.1rem);
	transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.turn-indicator.my-turn {
	background: linear-gradient(135deg, #4dabf7 0%, #2563eb 100%);
	color: #fff;
}

.turn-indicator.review {
	opacity: 0.95;
}

.dot {
	width: clamp(10px, 1vw, 14px);
	height: clamp(10px, 1vw, 14px);
	border-radius: 50%;
	background: #4dabf7;
	box-shadow: 0 0 0 5px rgba(77, 173, 247, 0.22);
}

.turn-text {
	white-space: nowrap;
	font-size: clamp(0.9rem, 1vw, 1.1rem);
}

.promotion-bar {
	background: rgba(255, 255, 255, 0.16);
	padding: clamp(8px, 0.8vw, 12px) clamp(10px, 1vw, 14px);
}

.promotion-bar button {
	background: rgba(255, 255, 255, 0.22);
	border: none;
	border-radius: 14px;
	padding: clamp(6px, 0.8vw, 10px);
	cursor: pointer;
	transition: background 0.15s ease, transform 0.15s ease;
}

.promotion-bar button:hover {
	background: rgba(255, 255, 255, 0.32);
	transform: translateY(-1px);
}

.promotion-bar img {
	width: clamp(28px, 2.5vw, 36px);
	height: clamp(28px, 2.5vw, 36px);
}

.bottom-bar {
	display: flex;
	width: 100%;
	align-items: center;
	background: #ccc;
	flex: 0 0 clamp(30px, 4vh, 60px);
}

.surrender-btn {
	background: #dc3545;
	color: white;

	border: none;
	padding: 6px 12px;
	border-radius: 6px;

	font-size: 0.9rem;

	transition: all 0.15s ease;
}

.surrender-btn:hover {
	background: #c82333;
	transform: translateY(-1px);
}

.surrender-btn:active {
	transform: scale(0.98);
}

.bottom-spacer {
	width: 800px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.move-controls-panel {
	height: 95%;
	width: 95%;
	flex: 1;
	display: flex;
	justify-content: space-between;
	gap: 4px;
}

.chess-board {
	width: 100%;
	height: 100%;
	aspect-ratio: 1 / 1;

	display: grid;
	grid-template-columns: repeat(8, 1fr);
	grid-template-rows: repeat(8, 1fr);

	border-radius: 8px;
	overflow: hidden;
}

.square {
	position: relative;
	border: none;
	padding: 0;
	cursor: pointer;

	display: flex;
	align-items: center;
	justify-content: center;
}

.light {
	background: #f0d9b5;
}

.dark {
	background: #b58863;
}

.square.selected::after {
	content: '';
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.3);
	pointer-events: none;
}

.piece {
	width: 80%;
	height: 80%;
	object-fit: contain;
	pointer-events: none;
	z-index: 2;
}

.coord {
	position: absolute;
	font-size: 0.7rem;
	font-weight: bold;
	opacity: 0.7;
	pointer-events: none;
}

.file {
	bottom: 2px;
	right: 4px;
}

.rank {
	top: 2px;
	left: 4px;
}

.move-highlight::after {
	content: '';
	position: absolute;
	inset: 0;
	background: rgba(255, 255, 0, 0.25); /* yellow */
	pointer-events: none;
	z-index: 1;
}

.nav-btn {
	flex: 1;
	border: none;
	padding: 6px 10px;
	border-radius: 5px;

	background: #2b2f33;
	color: white;

	transition: all 0.15s ease;
}

.nav-btn:hover {
	background: #3a3f45;
}

.nav-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.modal {
	position: fixed;
	inset: 0;

	display: flex;
	justify-content: center;
	align-items: center;

	z-index: 9999;
}

.modal-backdrop {
	position: fixed;
	inset: 0;

	background: rgba(0,0,0,0.65);
	backdrop-filter: blur(4px);

	z-index: 9998;
}

.modal-dialog {
	width: min(90vw, 400px);
}

.modal-content {
	background: #2b2f33;
	color: white;

	border-radius: 14px;
	border: 1px solid rgba(255,255,255,0.08);

	box-shadow:
		0 10px 40px rgba(0,0,0,0.45),
		0 0 0 1px rgba(255,255,255,0.03);

	overflow: hidden;

	animation: modalPop 0.18s ease;
}

.modal-header {
	padding: 18px 20px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	font-size: 1.25rem;
	font-weight: 700;
	background: #dc3545;
	color: #fff;
}

.modal-header h5 {
	margin: 0;
	font-size: inherit;
}

.modal-body {
	padding: 20px;
	color: #d4d4d4;
}

.modal-footer {
	display: flex;
	gap: 10px;

	border-top: 1px solid rgba(255,255,255,0.06);
	padding: 14px 20px;
}

.modal-footer .btn-secondary,
.modal-footer .btn-danger {
	flex: 1;
	padding: 12px 0;
	font-weight: 700;
	border: none;
	border-radius: 10px;
	cursor: pointer;
	transition: background 0.15s ease;
}

.modal-footer .btn-secondary {
	background: #4b5563;
	color: #fff;
}

.modal-footer .btn-secondary:hover {
	background: #5b6470;
}

.modal-footer .btn-danger {
	background: #dc3545;
	color: #fff;
}

.modal-footer .btn-danger:hover {
	background: #c82333;
}

@media (max-width: 1200px) {

	.game-container {
		max-width: 800px;
	}

	.game-layout {
		height: 70%;
		flex-direction: column;
		width: 100%;
		align-items: center;
	}

	.board-area {
		width: 100%;
		max-width: 100vw;
		display: flex;
		flex: 0 0 auto;
	}

	.side-area {
		display: none;
	}

	.bottom-spacer {
		width: 50%;
	}
}

</style>