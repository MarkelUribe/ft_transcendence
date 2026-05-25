import { goto } from '$app/navigation';
import { io, type Socket } from 'socket.io-client';
import { getExistingGame } from '$lib/api/chess';
import { writable, get } from 'svelte/store';

let socket: Socket | null = null;
export const searching = writable(false);

let friendsActivityTimer: ReturnType<typeof setInterval> | null = null;

export type FriendActivity = {
	userId: number;
	online: boolean;
	inQueue: boolean;
	gameId: string | null;
};

async function startMatchmaking() {
	searching.set(true);

	const token = localStorage.getItem("token");
	if (!token) { searching.set(false); return; }
	const game = await getExistingGame(token);
	if (game?.gameId) {
		searching.set(false);
		return goto(`/game/${game.gameId}`);
	}

	const s = initMatchmakingSocket();
	if (!s) {
		searching.set(false);
		return;
	}

	s.emit("joinQueue");
}

export function initMatchmakingSocket() {
	const token = localStorage.getItem("token");
  if (!token) return null;

  // si ya hay socket, intenta reconectar si está desconectado
  if (socket) {
    if (!socket.connected) {
      try { socket.connect(); } catch { /* ignore */ }
    }
    return socket;
  }

  socket = io("https://localhost:3000", { auth: { token }, transports: ["websocket"] });

  socket.on('connect', () => {
    // pedir actividad de amigos inmediatamente al conectar
    socket?.emit('friends:getActivity', (rows: FriendActivity[]) => {
      window.dispatchEvent(new CustomEvent('friends:activity', { detail: rows }));
    });
  });

  socket.on("matched", ({ gameId }: { gameId: string }) => {
    searching.set(false);
    goto(`/game/${gameId}`);
  });

  socket.on("match:inviteError", (e) => console.error("Invite error:", e));
  socket.on("match:inviteSent", (e) => console.log("Invite sent:", e));

  socket.on("match:inviteReceived", (inv) => {
    window.dispatchEvent(new CustomEvent("match:inviteReceived", { detail: inv }));
  });

  socket.on("match:pendingInvites", (invites) => {
    window.dispatchEvent(new CustomEvent("match:pendingInvites", { detail: invites }));
  });

  return socket;
}

export function disconnectMatchmakingSocket() {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } catch { /* ignore */ }
  socket = null;
}

export function inviteFriend(friendId: number) {
	initMatchmakingSocket()?.emit("inviteFriend", { friendId });
}

function cancelMatchmaking() {
	socket?.emit("leaveQueue");
	searching.set(false);
}

export function handleButtonClick() {
	if (get(searching)) cancelMatchmaking();
	else startMatchmaking();
}

export function acceptInvite(inviteId: string) {
	initMatchmakingSocket()?.emit("acceptInvite", { inviteId });
}

export function rejectInvite(inviteId: string) {
	initMatchmakingSocket()?.emit("rejectInvite", { inviteId });
}

export function startFriendsActivityPolling(intervalMs = 5000) {
	if (friendsActivityTimer) return;

	const tick = () => {
		const s = initMatchmakingSocket();
		if (!s) return;

		s.emit("friends:getActivity", (rows: FriendActivity[]) => {
			window.dispatchEvent(new CustomEvent("friends:activity", { detail: rows }));
		});
	};

	tick();
	friendsActivityTimer = setInterval(tick, intervalMs);
}

export function stopFriendsActivityPolling() {
	if (friendsActivityTimer) clearInterval(friendsActivityTimer);
	friendsActivityTimer = null;
}