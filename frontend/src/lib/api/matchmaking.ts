import { goto } from '$app/navigation';
import { io, type Socket } from 'socket.io-client';
import { getExistingGame } from '$lib/api/chess';
import { writable, get } from 'svelte/store';

let socket: Socket | null = null;
export const searching = writable(false);
let status = 'Not searching';

async function startMatchmaking() {
	searching.set(true);
	status = 'Checking for existing game...';

	const token = localStorage.getItem("token");

	const game = await getExistingGame(token);
	if (game?.gameId) return goto(`/game/${game.gameId}`);

	socket = io('https://localhost:3000', { auth: { token } });

	socket.on('connect', () => {
		status = 'Searching for opponent...';
		socket.emit('joinQueue');
	});

	socket.on('waiting', () => {
		status = 'Waiting for opponent...';
	});

	socket.on('matched', (data: { gameId: string }) => {
		searching.set(false);
		goto(`/game/${data.gameId}`);
	});

	socket.on('disconnect', () => {
		status = 'Disconnected...';
		searching.set(false);
	});
}

function cancelMatchmaking() {
	if (!socket) return;
	socket.emit('leaveQueue');
	socket.disconnect();
	socket = null;
	status = 'Matchmaking canceled';
	searching.set(false);
}

export function handleButtonClick() {
	if (get(searching)) cancelMatchmaking();
	else startMatchmaking();
}
