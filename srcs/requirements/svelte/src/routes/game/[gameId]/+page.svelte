<script lang="ts">

import { onMount, onDestroy } from 'svelte';
import { page } from '$app/stores';
import { io, type Socket } from 'socket.io-client';
import { ChessAPI } from '$lib/api/chess';
import { goto } from '$app/navigation';
import ChatWidget from "$lib/components/ChatWidget.svelte";
import { browser } from "$app/environment";

const BASE_URL = import.meta.env.VITE_API_URL;

let board: (string | null)[][] = [];
let logs: any[] = [];
let currentMoveIndex = 0;
let moveFrom: string | null = null;
let moveTo: string | null = null;

let gameId = '';
let gameStatus: 'active' | 'ended' = 'active';

let selected: string | null = null;
let turn: 'white' | 'black' = 'white';
let myColor: 'white' | 'black' | 'spectator' = 'spectator';
let gameOver = false;
let resultText = '';

let whiteUsername: string | null = null;
let blackUsername: string | null = null;
let whiteTime: number;
let blackTime:number;
let lastMoveTimestamp: number;
let whiteId: number | null = null;
let blackId: number | null = null;
let whitePlayer: any = null;
let blackPlayer: any = null;

let promotion = false;
let promotionSquare: string | null = null;

let gameMessages: Array<{ user: string; text: string }> = [];
const myUsername = browser ? (localStorage.getItem("username") ?? "") : "";
const onSendGameChat = (text: string) => {
	socket?.emit("sendMessage", { gameId, user: myUsername, text });
};

let socket: Socket;

let sidePanel: "LOGS" | "CHAT" = "LOGS";

let pendingPromotionMove: { from: string, to: string } | null = null;
//let api: ChessAPI;

$: display = myColor === 'black' ? board.map(r => [...r].reverse()).reverse() : board;
$: isReviewMode = (currentMoveIndex != logs.length - 1) || (gameStatus === 'ended');

let showSurrender = false;
let showDraw = false;

let drawOffer: boolean = false;

function confirmAction()
{
	if (showSurrender)
	{
		socket?.emit('surrender', { gameId });
	}

	if (showDraw)
	{
		socket?.emit('draw', { gameId });
	}

	showSurrender = false;
	showDraw = false;
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

	if (state.status === 'active')
	{
		currentMoveIndex = logs.length - 1;
	}

	goToMove(currentMoveIndex);

	whiteUsername = state.white.username;
	blackUsername = state.black.username;

	lastMoveTimestamp = state.lastMoveTimestamp;

	const id = localStorage.getItem('id');

	if (id === String(state.white.id)) myColor = 'white';
	if (id === String(state.black.id)) myColor = 'black';

	gameStatus = state.status;

	whitePlayer = state.white;
	blackPlayer = state.black;
	whiteId = state.white.id;
	blackId = state.black.id;
	whiteUsername = state.white.username;
	blackUsername = state.black.username;

	updateDrawOffer(state);
}

function updateDrawOffer(msg: any)
{
	if ((msg.whiteDraw && myColor === 'black') || (msg.blackDraw && myColor === 'white'))
		drawOffer = true;
	else
		drawOffer = false;
}

function goToMove(index: number)
{
	if (index < 0 || index >= logs.length) return;

	selected = null;

	currentMoveIndex = index;

	const move = logs[index];

	board = parseFen(move.fen);
	turn = move.fen.split(' ')[1] === 'w'? 'white' : 'black';

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
	turn = msg.move.fen.split(' ')[1] === 'w'? 'white' : 'black';

	moveFrom = msg.move.from ?? null;
	moveTo = msg.move.to ?? null;

	whiteTime = msg.move.whiteTimeMs;
	blackTime = msg.move.blackTimeMs;
	lastMoveTimestamp = msg.lastMoveTimestamp;

	updateDrawOffer(msg);
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

	gameStatus = 'ended';
	gameOver = true;
}

function originalIndices(r: number, c: number)	{ return myColor === 'black' ? [7 - r, 7 - c] : [r, c]; }
function getPieceImage(piece: string | null)	{ return piece ? `/pieces/${piece}.png` : ''; }
function goHome()								{ window.location.href = '/'; }

function coordFromDisplay(r: number, c: number)
{
	const [or, oc] = originalIndices(r, c);
	return `${String.fromCharCode(97 + oc)}${8 - or}`;
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

	if (isReviewMode)
	{
		selected = null;
		return;
	}

	if (selected && piece)
	{
		const color = piece < 'a' ? 'white' : 'black';
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
	if (piece)
	{
		const color = piece < 'a' ? 'white' : 'black';
		if (myColor !== turn) return;
		if (color === turn) selected = coord;
	}
}

function handlePromotionChoice(piece: string)
{
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

	socket = io(BASE_URL, { auth: { token: localStorage.getItem("token") } });

	socket.on('connect', () => { socket.emit('joinGame', { gameId, playerId: localStorage.getItem('id') }); });

	socket.on('gameState', setState);

	socket.on('moveMade', updateState);

	socket.on('drawOffer', updateDrawOffer);

	socket.on('ended', handleEnd);

	socket.on('notFound', () => goto('/'));

	socket.on("chatHistory", (history) => {	gameMessages = Array.isArray(history) ? history : []; });

	socket.on("chatMessage", (msg) => { gameMessages = [...gameMessages, msg]; });
});

/*
		this.server.to(gameId).emit('drawOffer', {
			whiteDraw: game.whiteDraw,
			blackDraw: game.blackDraw,
		});
*/

function getPromotionPieces(color: 'white' | 'black' | 'spectator')
{
	if (color === 'white')
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

let now = Date.now();

setInterval(() => { now = Date.now(); }, 100);

function formatTime(ms: number)
{
	ms = Math.max(0, ms);

	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	if (ms < 15000 && ms > 0) {
		const millis = Math.floor((ms % 1000) / 100); // tenths of a second
		return `${seconds.toString().padStart(2)}.${millis}`;
	}

	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getWhiteTime(now: number, whiteMs: number)
{
	let ms = whiteMs;

	if (turn === 'white' && !isReviewMode)
	{
		ms -= now - lastMoveTimestamp;
	}
	return ms;
}

function getBlackTime(now: number, blackMs: number)
{
	let ms = blackMs;

	if (turn === 'black' && !isReviewMode)
	{
		ms -= now - lastMoveTimestamp;
	}
	return ms;
}

let blackClock: number;
let whiteClock: number;

$: blackClock = getBlackTime(now, blackTime);
$: whiteClock = getWhiteTime(now, whiteTime);

let headerText: string;
let bodyText: string;

onDestroy(() => socket?.disconnect());
</script>

<div class="page">
	{console.log('gameStatus:', gameStatus)}
	<div class="game-container">
		<div class="top-bar">
			<div class="spacer">
				{#if myColor !== 'black'}
					<div class="player-chip-row">
						<a class="player-chip" href={`/profile/${blackId}`}>
							<img
							class="player-chip__avatar"
							src={`${BASE_URL}${blackPlayer?.avatarUrl}`}
							alt={whitePlayer?.username || 'Player avatar'}
							/>
							<div class ="player-name_elo">
								<span class="player-chip__name">{blackPlayer?.username}</span>
								<span class="player-chip__elo">{blackPlayer?.elo ?? 0} ELO</span>
							</div>
						</a>
					</div>
					<div class="bg-secondary border rounded-3 px-4 py-2 d-inline-block m-3 shadow-sm" class:bg-danger={blackClock < 16000}>
						{formatTime(blackClock)}
					</div>
				{:else}
					<div class="player-chip-row">
						<a class="player-chip" href={`/profile/${whiteId}`}>
							<img
								class="player-chip__avatar"
								src={`${BASE_URL}${whitePlayer?.avatarUrl}`}
								alt={whitePlayer?.username || 'Player avatar'}
							/>
							<div class ="player-name_elo">
								<span class="player-chip__name">{whitePlayer?.username}</span>
								<span class="player-chip__elo">{whitePlayer?.elo ?? 0} ELO</span>
							</div>
						</a>
					</div>
					<div class="clock-badge bg-secondary border rounded-3 px-4 py-2 d-inline-block m-3 shadow-sm" class:bg-danger={whiteClock < 15000}>
							{formatTime(whiteClock)}
					</div>

				{/if}
				{#if promotion && myColor}
					<div class="d-flex gap-1 p-1 rounded-2 shadow-sm border bg-light bg-opacity-25 backdrop-blur align-items-center">
						{#each getPromotionPieces(myColor) as p}
							<button
								type="button"
								class="btn btn-outline-dark btn-sm p-1 d-flex align-items-center justify-content-center"
								on:click={() => handlePromotionChoice(p)}
							>
								<img src={getPieceImage(p)} alt={p} class="img-fluid promo-piece" />
							</button>
						{/each}
					</div>
				{:else}
					{#if isReviewMode}
						<div class="controls">
							<button class="surrender-btn"> Review Mode </button>
						</div>
					{:else}
						{#if drawOffer}
							<div class="controls">
								<button class="surrender-btn" on:click={() => {showDraw = true; headerText = "Accept the Draw?"; bodyText = "The game will end in a draw if accepted."}}> Accept Draw? </button>
							</div>
						{:else}
							{#if myColor === 'spectator'}
								<div class="controls">
									<button class="surrender-btn"> Spectator Mode </button>
								</div>
							{/if}
						{/if}
					{/if}
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
										{myColor === 'black' ? String.fromCharCode(104 - c) : String.fromCharCode(97 + c)}
									</span>
								{/if}
								{#if c === 0}
									<span class="coord rank">
										{myColor === 'black' ? r + 1 : 8 - r}
									</span>
								{/if}
							</button>
						{/each}
					{/each}
				</div>
			</div>
			<div class="side-area">
				<div class="side-tabs">
					<button
						class:active={sidePanel === "LOGS"}
						on:click={() => (sidePanel = "LOGS")}>Logs</button
					>
					<button
						class:active={sidePanel === "CHAT"}
						on:click={() => (sidePanel = "CHAT")}>Chat</button
					>
				</div>

				{#if sidePanel === "LOGS"}
					<div class="logs-panel card shadow-sm h-100">
						<div class="card-body p-0 logs-list">
							{#each groupMoves(logs.slice(1)) as move, i}
								<div
									class="log-row d-flex align-items-center px-3 py-2"
								>
									<span class="move-number text-muted">
										{move.number}.
									</span>
									<button
										class="move-btn white-move"
										class:active-move={currentMoveIndex ===
											i * 2 + 1}
										on:click={() => goToMove(i * 2 + 1)}
									>
										{move.white?.san}
									</button>
									<button
										class="move-btn black-move"
										class:active-move={currentMoveIndex ===
											i * 2 + 2}
										on:click={() => goToMove(i * 2 + 2)}
									>
										{move.black?.san}
									</button>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="logs-panel card shadow-sm h-100 chat-panel">
						<ChatWidget
							compact={false}
							isInGame={true}
							showGameChat={true}
							{gameMessages}
							{myUsername}
							opponentName={myColor === "white"
								? blackPlayer?.username
								: whitePlayer?.username}
							{onSendGameChat}
							gameId={null}
						/>
					</div>
				{/if}
			</div>
		</div>
		<div class="bottom-bar">
			<div class="spacer">
				{#if myColor === 'black'}
					<div class="player-chip-row">
						<a class="player-chip" href={`/profile/${blackId}`}>
							<img
							class="player-chip__avatar"
								src={`${BASE_URL}${blackPlayer?.avatarUrl}`}
								alt={blackPlayer?.username}
							/>
							<div class ="player-name_elo">
								<span class="player-chip__name">{blackPlayer?.username}</span>
								<span class="player-chip__elo">{blackPlayer?.elo ?? 0} ELO</span>
							</div>
						</a>
					</div>
					<div class="bg-secondary border rounded-3 px-4 py-2 d-inline-block m-3 shadow-sm" class:bg-danger={blackClock < 15000}>
						{formatTime(blackClock)}
					</div>
				{:else}
					<div class="player-chip-row">
						<a class="player-chip" href={`/profile/${whiteId}`}>
						<img
								class="player-chip__avatar"
								src={`${BASE_URL}${whitePlayer?.avatarUrl}`}
								alt={whitePlayer?.username}
							/>
							<div class ="player-name_elo">
								<span class="player-chip__name">{whitePlayer?.username}</span>
								<span class="player-chip__elo">{whitePlayer?.elo ?? 0} ELO</span>
							</div>
						</a>
					</div>
					<div class="clock-badge bg-secondary border rounded-3 px-4 py-2 d-inline-block m-3 shadow-sm" class:bg-danger={whiteClock < 15000}>
						{formatTime(whiteClock)}
					</div>
				{/if}
				{#if !isReviewMode}
					<div class="controls">
						<button class="surrender-btn" on:click={() => {showSurrender = true; headerText = "Confirm Surrender"; bodyText = "You will lose the game."}}> 🏳️ </button>
					</div>
					<div class="controls">
						<button class="surrender-btn" on:click={() => {showDraw = true; headerText = "Offer a Draw?"; bodyText = "The game will end in a draw if accepted."}}> 🤝 </button>
					</div>
				{/if}
			</div>


			<div class="move-controls-panel">
				<button class="nav-btn" on:click={goToStart} disabled={currentMoveIndex <= 0}>◀◀</button>
				<button class="nav-btn" on:click={prevMove} disabled={currentMoveIndex <= 0}>◀</button>
				<button class="nav-btn" on:click={nextMove} disabled={currentMoveIndex >= logs.length - 1}>▶</button>
				<button class="nav-btn" on:click={goToEnd} disabled={currentMoveIndex >= logs.length - 1}>▶▶</button>
			</div>
		</div>
		{#if showSurrender || showDraw}
		<div class="modal">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5>{headerText}</h5>
					</div>
					<div class="modal-body">
						{bodyText}
					</div>
					<div class="modal-footer">
						<button class="btn-secondary" on:click={() => {showSurrender = false; showDraw = false}}>
							Cancel
						</button>
						<button class="btn-danger" on:click={confirmAction}>
							Accept
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
	zoom: 0.8;
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

.promo-piece {
	height: 4vh;
	min-width: 40px;
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
	border: 1px solid rgb(255 255 255 / 5%);
	border-radius: 10px;
	box-shadow: 0 8px 25px rgb(0 0 0 / 20%);

	display: flex;
	flex-direction: column;

	flex: 1;
	min-height: 0;
	overflow: hidden;
}

.logs-list {
	flex: 1;
	overflow-y: auto;
}

.logs-list::-webkit-scrollbar {
	width: .625rem;
}

.logs-list::-webkit-scrollbar-thumb {
	background: #717171;
	border-radius: .2rem;
}

.log-row {
	display: grid;
	grid-template-columns: 5rem 1fr 1fr;
	gap: .75rem;

	align-items: start;
	padding: .75rem 1rem;

	font-size: 1rem;
	line-height: 1.5;

	min-width: 0;
	border-bottom: 1px solid rgb(255 255 255 / 4%);
	transition: background .15s ease;
}

.log-row > * {
	min-width: 0;
	overflow-wrap: anywhere;
}

.log-row:hover {
	background: rgb(255 255 255 / 5%);
}

.side-tabs {
	display: flex;
	gap: 6px;
	padding: 8px;
	background: #2b2f33;
	border: 1px solid rgb(255 255 255 / 5%);
	border-radius: 10px;
}

.side-tabs button {
	flex: 1;
	border: none;
	border-radius: 8px;
	padding: 8px 10px;
	background: transparent;
	color: white;
	opacity: 0.7;
}

.side-tabs button.active {
	opacity: 1;
	background: rgb(255 255 255 / 8%);
}

.move-number {
	color: #fff !important;
	min-width: 30px;
}

.active-move {
	background: #4dabf7;
	color: #fff;
	box-shadow: 0 0 0 1px rgb(193, 193, 193);
}

.move-btn {
	justify-self: stretch;
	width: 100%;

	border: none;
	background: transparent;

	text-align: center;
	border-radius: 6px;

	transition: all 0.15s ease;

	font-size: inherit;
	padding: clamp(2px, 0.4vw, 6px);
}

.white-move {
	color: #ffffff;
}

.black-move {
	color: #808080 !important;
}

.top-bar {
	background: #2b2f33;
	display: flex;
	align-items: center;
	flex: 0 0 clamp(40px, 6vh, 80px);
	width: 100%;
}

.bottom-bar {
	background: #2b2f33;
	display: flex;
	align-items: center;
	flex: 0 0 clamp(40px, 6vh, 80px);
	width: 100%;
}

.surrender-btn {
	background: #646464;
	color: white;

	border: none;
	padding: 6px 12px;
	border-radius: 6px;

	font-size: 0.9rem;

	gap: .75rem;

	transition: all 0.15s ease;
}

.surrender-btn:hover {
	background: #c82333;
}

.surrender-btn:active {
	transform: scale(0.98);
}

.spacer {
	width: 800px;
	display: flex;
	align-items: center;
}

.move-controls-panel {
	height: 80%;
	width: 95%;
	flex: 1;
	display: flex;
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

@media (max-width: 2000px) {
	.page {
		zoom: 0.9;
	}
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

	.spacer {
		width: 60%;
	}
}

.player-chip-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  max-width: 12rem;
  margin-left: 0.2rem;
}

.player-chip {
  padding: 0.7rem 0.7rem;
  border-radius: 10px;
  background: #2b2f33;
  color: white;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 140px;
}

.player-chip:hover {
  background: #3a3f45;
}

.player-chip__name {
  font-weight: 700;
}

.player-chip__elo {
  font-size: 0.85rem;
  opacity: 0.8;
}

.player-chip {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.player-chip__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-name_elo{
	display: flex; 
	flex-direction: column;
	overflow: hidden;
}

@media (max-width: 640px) {
  .top-bar,
  .bottom-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 6px 8px;
  }

  .spacer {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .player-chip-row {
    max-width: none;
    flex: 1;
    min-width: 0;
  }

  .player-chip {
    min-width: 0;
    padding: 0.4rem 0.55rem;
  }

  .player-chip__avatar {
    width: 28px;
    height: 28px;
  }

  .player-chip__name {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-chip__elo {
    display: none;
  }

  .clock-badge {
    margin: 0 !important;          /* pisa m-3 de bootstrap */
    padding: 0.25rem 0.6rem !important; /* pisa px-4 py-2 */
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .move-controls-panel {
    width: 100%;
    height: auto;
    flex: 0 0 auto;
    gap: 6px;
  }

  .nav-btn {
    padding: 8px 0;
    font-size: 0.95rem;
  }

}

.chat-panel {
	flex: 1;
	min-height: 0;
	overflow: hidden;
	background-color: white;
}

.chat-panel :global(.chat-box) {
	width: 100%;
	height: 100%;
	display: flex;
}

.chat-panel :global(.chat-container) {
	width: 100%;
	height: 100%;
}
</style>